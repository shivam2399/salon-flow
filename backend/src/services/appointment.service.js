import { Op } from "sequelize";
import { DateTime } from "luxon";

import {
  sequelize,
  Salon,
  Service,
  StaffProfile,
  StaffService,
  BusinessHour,
  StaffAvailability,
  Appointment,
  User,
  Payment,
  Review,
} from "../models/index.js";

import {
  sendBookingConfirmation,
  sendRescheduleConfirmation,
  sendCancellationNotification,
} from "./notification.service.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function localTime(date, time, timezone) {
  return DateTime.fromISO(`${date}T${time}`, {
    zone: timezone,
  });
}

export async function createAppointment({
  customerId,
  serviceId,
  staffId,
  startTime,
  notes,
}) {
  const requestedStart = DateTime.fromISO(startTime, {
    setZone: true,
  });

  if (!requestedStart.isValid) {
    throw createError("Invalid appointment start time", 400);
  }

  let createdAppointment = null;
  let bookingMeta = null;

  await sequelize.transaction(async (transaction) => {
    const salon = await Salon.findOne({
      where: {
        slug: process.env.SALON_SLUG || "salonflow-demo",
        isActive: true,
      },
      transaction,
    });

    if (!salon) {
      throw createError("Salon not found", 404);
    }

    const timezone = salon.timezone || "Asia/Kolkata";
    const start = requestedStart.setZone(timezone);
    const now = DateTime.now().setZone(timezone);

    if (start <= now) {
      throw createError("Appointment must be in the future", 400);
    }

    if (
      start.minute % 15 !== 0 ||
      start.second !== 0 ||
      start.millisecond !== 0
    ) {
      throw createError(
        "Please choose a time slot offered by the availability API",
        400
      );
    }

    const service = await Service.findOne({
      where: {
        id: serviceId,
        salonId: salon.id,
        isActive: true,
      },
      transaction,
    });

    if (!service) {
      throw createError("Service not found", 404);
    }

    const staff = await StaffProfile.findOne({
      where: {
        id: staffId,
        salonId: salon.id,
        isActive: true,
      },
      include: [
        {
          association: "user",
          attributes: ["id", "name"],
          where: { isActive: true },
          required: true,
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!staff) {
      throw createError("Staff member not found", 404);
    }

    const assignment = await StaffService.findOne({
      where: {
        staffId: staff.id,
        serviceId: service.id,
      },
      transaction,
    });

    if (!assignment) {
      throw createError(
        "This staff member does not provide the selected service",
        400
      );
    }

    const date = start.toISODate();
    const dayOfWeek = start.weekday % 7;

    const businessHour = await BusinessHour.findOne({
      where: {
        salonId: salon.id,
        dayOfWeek,
      },
      transaction,
    });

    if (
      !businessHour ||
      businessHour.isClosed ||
      !businessHour.opensAt ||
      !businessHour.closesAt
    ) {
      throw createError("The salon is closed on this date", 400);
    }

    const salonOpens = localTime(
      date,
      businessHour.opensAt,
      timezone
    );
    const salonCloses = localTime(
      date,
      businessHour.closesAt,
      timezone
    );

    const end = start.plus({
      minutes: service.durationMinutes,
    });

    if (start < salonOpens || end > salonCloses) {
      throw createError(
        "Appointment falls outside salon business hours",
        400
      );
    }

    const availability = await StaffAvailability.findOne({
      where: {
        staffId: staff.id,
        dayOfWeek,
      },
      transaction,
    });

    if (!availability) {
      throw createError(
        "Staff member is not working on this date",
        400
      );
    }

    const staffStarts = localTime(
      date,
      availability.startsAt,
      timezone
    );
    const staffEnds = localTime(
      date,
      availability.endsAt,
      timezone
    );

    if (start < staffStarts || end > staffEnds) {
      throw createError(
        "Appointment falls outside staff working hours",
        400
      );
    }

    const conflict = await Appointment.findOne({
      where: {
        salonId: salon.id,
        staffId: staff.id,
        status: {
          [Op.notIn]: ["cancelled", "no_show"],
        },
        startTime: { [Op.lt]: end.toJSDate() },
        endTime: { [Op.gt]: start.toJSDate() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (conflict) {
      throw createError(
        "This time slot is no longer available",
        409
      );
    }

    const appointment = await Appointment.create(
      {
        salonId: salon.id,
        customerId,
        staffId: staff.id,
        serviceId: service.id,
        startTime: start.toJSDate(),
        endTime: end.toJSDate(),
        pricePaise: service.pricePaise,
        durationMinutes: service.durationMinutes,
        status: "confirmed",
        notes: notes || null,
      },
      { transaction }
    );

    const customer = await User.findByPk(customerId, { transaction });

    createdAppointment = appointment;
    bookingMeta = {
      customerEmail: customer?.email,
      customerName: customer?.name,
      serviceName: service.name,
      staffName: staff.user?.name,
      salonName: salon.name,
      startTime: appointment.startTime,
    };
  });

  // Asynchronously trigger confirmation email (don't block response on error)
  if (bookingMeta && bookingMeta.customerEmail) {
    sendBookingConfirmation({
      to: bookingMeta.customerEmail,
      customerName: bookingMeta.customerName,
      serviceName: bookingMeta.serviceName,
      staffName: bookingMeta.staffName,
      startTime: bookingMeta.startTime,
      salonName: bookingMeta.salonName,
    }).catch((err) => console.error("Email send error:", err));
  }

  return createdAppointment;
}

export async function getMyAppointments(customerId) {
  return Appointment.findAll({
    where: { customerId },
    attributes: [
      "id",
      "startTime",
      "endTime",
      "pricePaise",
      "durationMinutes",
      "status",
      "notes",
      "createdAt",
    ],
    include: [
      {
        association: "service",
        attributes: ["id", "name", "slug"],
      },
      {
        association: "staff",
        attributes: ["id"],
        include: [
          {
            association: "user",
            attributes: ["name"],
          },
        ],
      },
      {
        association: "payment",
        attributes: ["id", "status", "paymentMethod", "invoiceNumber"],
      },
      {
        association: "review",
        attributes: ["id", "rating", "comment", "staffResponse", "respondedAt"],
      },
    ],
    order: [["startTime", "DESC"]],
  });
}

export const cancelAppointment = async ({ appointmentId, customerId }) => {
  let cancelledAppt = null;
  let cancelMeta = null;

  await sequelize.transaction(async (transaction) => {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        customerId,
      },
      include: [
        { model: Service, as: "service" },
        { model: User, as: "customer" },
        { model: Salon, as: "salon" },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!appointment) {
      const error = new Error("Appointment not found.");
      error.statusCode = 404;
      throw error;
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      const error = new Error(
        `Cannot cancel an appointment with status "${appointment.status}".`
      );
      error.statusCode = 409;
      throw error;
    }

    if (new Date(appointment.startTime).getTime() <= Date.now()) {
      const error = new Error(
        "An appointment cannot be cancelled after it has started."
      );
      error.statusCode = 409;
      throw error;
    }

    appointment.status = "cancelled";
    await appointment.save({ transaction });

    cancelledAppt = appointment;
    cancelMeta = {
      customerEmail: appointment.customer?.email,
      customerName: appointment.customer?.name,
      serviceName: appointment.service?.name,
      startTime: appointment.startTime,
      salonName: appointment.salon?.name,
    };
  });

  if (cancelMeta && cancelMeta.customerEmail) {
    sendCancellationNotification({
      to: cancelMeta.customerEmail,
      customerName: cancelMeta.customerName,
      serviceName: cancelMeta.serviceName,
      startTime: cancelMeta.startTime,
      salonName: cancelMeta.salonName,
    }).catch((err) => console.error("Email send error:", err));
  }

  return cancelledAppt;
};

export async function rescheduleAppointment({
  appointmentId,
  customerId,
  newStartTime,
  user,
}) {
  const requestedStart = DateTime.fromISO(newStartTime, {
    setZone: true,
  });

  if (!requestedStart.isValid) {
    throw createError("Invalid appointment start time", 400);
  }

  let rescheduledAppt = null;
  let rescheduleMeta = null;

  await sequelize.transaction(async (transaction) => {
    const whereClause = { id: appointmentId };
    if (user.role !== "admin") {
      whereClause.customerId = customerId;
    }

    const appointment = await Appointment.findOne({
      where: whereClause,
      include: [
        { model: Service, as: "service" },
        { model: Salon, as: "salon" },
        { model: User, as: "customer" },
        {
          model: StaffProfile,
          as: "staff",
          include: [{ model: User, as: "user", attributes: ["name"] }],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!appointment) {
      throw createError("Appointment not found", 404);
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      throw createError(
        `Cannot reschedule appointment with status "${appointment.status}"`,
        409
      );
    }

    const timezone = appointment.salon.timezone || "Asia/Kolkata";
    const start = requestedStart.setZone(timezone);
    const now = DateTime.now().setZone(timezone);

    if (start <= now) {
      throw createError("Rescheduled appointment must be in the future", 400);
    }

    const date = start.toISODate();
    const dayOfWeek = start.weekday % 7;

    const businessHour = await BusinessHour.findOne({
      where: { salonId: appointment.salonId, dayOfWeek },
      transaction,
    });

    if (!businessHour || businessHour.isClosed || !businessHour.opensAt || !businessHour.closesAt) {
      throw createError("The salon is closed on this date", 400);
    }

    const salonOpens = localTime(date, businessHour.opensAt, timezone);
    const salonCloses = localTime(date, businessHour.closesAt, timezone);
    const end = start.plus({ minutes: appointment.durationMinutes });

    if (start < salonOpens || end > salonCloses) {
      throw createError("Appointment falls outside salon business hours", 400);
    }

    const availability = await StaffAvailability.findOne({
      where: { staffId: appointment.staffId, dayOfWeek },
      transaction,
    });

    if (!availability) {
      throw createError("Staff member is not working on this date", 400);
    }

    const staffStarts = localTime(date, availability.startsAt, timezone);
    const staffEnds = localTime(date, availability.endsAt, timezone);

    if (start < staffStarts || end > staffEnds) {
      throw createError("Appointment falls outside staff working hours", 400);
    }

    // Check conflict excluding current appointment
    const conflict = await Appointment.findOne({
      where: {
        id: { [Op.ne]: appointment.id },
        salonId: appointment.salonId,
        staffId: appointment.staffId,
        status: { [Op.notIn]: ["cancelled", "no_show"] },
        startTime: { [Op.lt]: end.toJSDate() },
        endTime: { [Op.gt]: start.toJSDate() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (conflict) {
      throw createError("This time slot is no longer available", 409);
    }

    appointment.startTime = start.toJSDate();
    appointment.endTime = end.toJSDate();
    await appointment.save({ transaction });

    rescheduledAppt = appointment;
    rescheduleMeta = {
      customerEmail: appointment.customer?.email,
      customerName: appointment.customer?.name,
      serviceName: appointment.service?.name,
      staffName: appointment.staff?.user?.name,
      newStartTime: appointment.startTime,
      salonName: appointment.salon?.name,
    };
  });

  if (rescheduleMeta && rescheduleMeta.customerEmail) {
    sendRescheduleConfirmation({
      to: rescheduleMeta.customerEmail,
      customerName: rescheduleMeta.customerName,
      serviceName: rescheduleMeta.serviceName,
      staffName: rescheduleMeta.staffName,
      newStartTime: rescheduleMeta.newStartTime,
      salonName: rescheduleMeta.salonName,
    }).catch((err) => console.error("Email send error:", err));
  }

  return rescheduledAppt;
}

export async function getAllAppointmentsAdmin({ status, date, staffId } = {}) {
  const where = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;
  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    where.startTime = { [Op.between]: [dayStart, dayEnd] };
  }

  return Appointment.findAll({
    where,
    include: [
      {
        model: Service,
        as: "service",
        attributes: ["id", "name", "pricePaise", "durationMinutes"],
      },
      {
        model: StaffProfile,
        as: "staff",
        include: [{ model: User, as: "user", attributes: ["name"] }],
      },
      {
        model: User,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: Payment,
        as: "payment",
      },
      {
        model: Review,
        as: "review",
      },
    ],
    order: [["startTime", "DESC"]],
  });
}

export async function updateAppointmentStatusAdmin({ appointmentId, status }) {
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: Service, as: "service" },
      { model: User, as: "customer" },
      { model: Salon, as: "salon" },
      {
        model: StaffProfile,
        as: "staff",
        include: [{ model: User, as: "user", attributes: ["name"] }],
      },
    ],
  });

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  const validStatuses = [
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ];

  if (!validStatuses.includes(status)) {
    throw createError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
  }

  appointment.status = status;
  await appointment.save();

  return appointment;
}
