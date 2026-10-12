
import { Op } from "sequelize";
import { DateTime } from "luxon";

import {
  Salon,
  Service,
  StaffProfile,
  BusinessHour,
  Appointment,
} from "../models/index.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseTime(date, time, timezone) {
  return DateTime.fromISO(`${date}T${time}`, { zone: timezone });
}

export async function getAvailableSlots({
  serviceId,
  date,
  staffId,
}) {
  const salon = await Salon.findOne({
    where: {
      slug: process.env.SALON_SLUG || "salonflow-demo",
      isActive: true,
    },
  });

  if (!salon) {
    throw createError("Salon not found", 404);
  }

  const timezone = salon.timezone || "Asia/Kolkata";

  const requestedDate = DateTime.fromISO(date, { zone: timezone });

  if (
    !requestedDate.isValid ||
    requestedDate.toISODate() !== date
  ) {
    throw createError("Invalid date. Use YYYY-MM-DD.", 400);
  }

  const today = DateTime.now().setZone(timezone);

  if (requestedDate.startOf("day") < today.startOf("day")) {
    throw createError("Cannot check availability for a past date", 400);
  }

  const service = await Service.findOne({
    where: {
      id: serviceId,
      salonId: salon.id,
      isActive: true,
    },
    attributes: [
      "id",
      "name",
      "durationMinutes",
      "pricePaise",
    ],
  });

  if (!service) {
    throw createError("Service not found", 404);
  }

  // Luxon uses Monday = 1 and Sunday = 7.
  // Our database uses Sunday = 0 and Saturday = 6.
  const dayOfWeek = requestedDate.weekday % 7;

  const businessHour = await BusinessHour.findOne({
    where: {
      salonId: salon.id,
      dayOfWeek,
    },
  });

  if (
    !businessHour ||
    businessHour.isClosed ||
    !businessHour.opensAt ||
    !businessHour.closesAt
  ) {
    return {
      date,
      timezone,
      service,
      staff: [],
    };
  }

  const salonOpens = parseTime(
    date,
    businessHour.opensAt,
    timezone
  );

  const salonCloses = parseTime(
    date,
    businessHour.closesAt,
    timezone
  );

  if (
    !salonOpens.isValid ||
    !salonCloses.isValid ||
    salonCloses <= salonOpens
  ) {
    throw createError("Invalid salon business hours", 500);
  }

  const staffWhere = {
    salonId: salon.id,
    isActive: true,
  };

  if (staffId !== undefined) {
    staffWhere.id = staffId;
  }

  const staffMembers = await StaffProfile.findAll({
    where: staffWhere,
    attributes: ["id", "bio", "specialties"],
    include: [
      {
        association: "user",
        attributes: ["id", "name"],
        where: { isActive: true },
        required: true,
      },
      {
        association: "services",
        attributes: ["id"],
        through: { attributes: [] },
        where: { id: service.id, isActive: true },
        required: true,
      },
      {
        association: "availability",
        attributes: ["dayOfWeek", "startsAt", "endsAt"],
        where: { dayOfWeek },
        required: true,
      },
    ],
    order: [["id", "ASC"]],
  });

  if (staffMembers.length === 0) {
    return {
      date,
      timezone,
      service,
      staff: [],
    };
  }

  // Find appointments that could conflict with any slot on this day.
  const dayStart = requestedDate.startOf("day").toJSDate();
  const nextDayStart = requestedDate
    .plus({ days: 1 })
    .startOf("day")
    .toJSDate();

  const appointments = await Appointment.findAll({
    where: {
      salonId: salon.id,
      staffId: {
        [Op.in]: staffMembers.map((staff) => staff.id),
      },
      startTime: { [Op.lt]: nextDayStart },
      endTime: { [Op.gt]: dayStart },
      status: {
        [Op.notIn]: ["cancelled", "no_show"],
      },
    },
    attributes: ["staffId", "startTime", "endTime"],
  });

  const appointmentsByStaff = new Map();

  for (const appointment of appointments) {
    const existing = appointmentsByStaff.get(appointment.staffId) || [];
    existing.push(appointment);
    appointmentsByStaff.set(appointment.staffId, existing);
  }

  const result = [];

  for (const staff of staffMembers) {
    const staffSlots = [];
    const staffAppointments = appointmentsByStaff.get(staff.id) || [];

    for (const availability of staff.availability) {
      const staffStarts = parseTime(
        date,
        availability.startsAt,
        timezone
      );

      const staffEnds = parseTime(
        date,
        availability.endsAt,
        timezone
      );

      if (
        !staffStarts.isValid ||
        !staffEnds.isValid ||
        staffEnds <= staffStarts
      ) {
        continue;
      }

      // The staff member must be working while the salon is open.
      const windowStart =
        staffStarts > salonOpens ? staffStarts : salonOpens;

      const windowEnd =
        staffEnds < salonCloses ? staffEnds : salonCloses;

      let slotStart = windowStart;

      while (
        slotStart.plus({
          minutes: service.durationMinutes,
        }) <= windowEnd
      ) {
        const slotEnd = slotStart.plus({
          minutes: service.durationMinutes,
        });

        const isFuture = slotStart > today;

        const overlaps = staffAppointments.some((appointment) => {
          const existingStart = DateTime.fromJSDate(
            appointment.startTime,
            { zone: timezone }
          );

          const existingEnd = DateTime.fromJSDate(
            appointment.endTime,
            { zone: timezone }
          );

          // Two intervals overlap when each starts before the other ends.
          return (
            slotStart < existingEnd &&
            slotEnd > existingStart
          );
        });

        if (isFuture && !overlaps) {
          staffSlots.push({
            startTime: slotStart.toISO(),
            endTime: slotEnd.toISO(),
          });
        }

        // Offer a new possible starting time every 15 minutes.
        slotStart = slotStart.plus({ minutes: 15 });
      }
    }

    result.push({
      id: staff.id,
      name: staff.user.name,
      bio: staff.bio,
      specialties: staff.specialties,
      slots: staffSlots,
    });
  }

  return {
    date,
    timezone,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      pricePaise: service.pricePaise,
    },
    staff: result,
  };
}
