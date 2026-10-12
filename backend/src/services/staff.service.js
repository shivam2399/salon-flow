import bcrypt from "bcryptjs";
import {
  Salon,
  StaffProfile,
  Service,
  StaffService,
  StaffAvailability,
  User,
  sequelize,
} from "../models/index.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getSalon() {
  const salon = await Salon.findOne({
    where: {
      slug: process.env.SALON_SLUG || "salonflow-demo",
      isActive: true,
    },
  });

  if (!salon) {
    throw createError("Salon not found", 404);
  }

  return salon;
}

const staffInclude = [
  {
    association: "user",
    attributes: ["id", "name", "email", "phone"],
    where: { isActive: true },
    required: true,
  },
  {
    association: "services",
    attributes: [
      "id",
      "name",
      "slug",
      "durationMinutes",
      "pricePaise",
    ],
    through: { attributes: [] },
    required: false,
  },
  {
    association: "availability",
    attributes: ["id", "dayOfWeek", "startsAt", "endsAt"],
    required: false,
  },
];

export async function getAllStaff(includeInactive = false) {
  const salon = await getSalon();
  const where = { salonId: salon.id };
  if (!includeInactive) {
    where.isActive = true;
  }

  return StaffProfile.findAll({
    where,
    attributes: ["id", "bio", "specialties", "isActive"],
    include: staffInclude,
    order: [["id", "ASC"]],
  });
}

export async function getStaffById(id) {
  const salon = await getSalon();

  const staff = await StaffProfile.findOne({
    where: {
      id,
      salonId: salon.id,
    },
    attributes: ["id", "bio", "specialties", "isActive"],
    include: staffInclude,
  });

  if (!staff) {
    throw createError("Staff member not found", 404);
  }

  return staff;
}

export async function createStaff({
  name,
  email,
  password,
  bio,
  specialties = [],
  serviceIds = [],
  schedules = [],
}) {
  const salon = await getSalon();

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError("User with this email already exists", 409);
  }

  return sequelize.transaction(async (transaction) => {
    const passwordHash = await bcrypt.hash(password || "Stylist123!", 12);
    const user = await User.create(
      {
        salonId: salon.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "staff",
      },
      { transaction }
    );

    const staffProfile = await StaffProfile.create(
      {
        userId: user.id,
        salonId: salon.id,
        bio: bio || `Stylist at ${salon.name}`,
        specialties: specialties || ["Hair styling"],
        isActive: true,
      },
      { transaction }
    );

    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      for (const sId of serviceIds) {
        await StaffService.create(
          { staffId: staffProfile.id, serviceId: sId },
          { transaction }
        );
      }
    }

    // Default schedules if none provided (Monday - Saturday 10:00 to 18:00)
    const availabilities = schedules.length > 0
      ? schedules
      : [1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          startsAt: "10:00:00",
          endsAt: "18:00:00",
        }));

    for (const sched of availabilities) {
      await StaffAvailability.create(
        {
          staffId: staffProfile.id,
          dayOfWeek: sched.dayOfWeek,
          startsAt: sched.startsAt,
          endsAt: sched.endsAt,
        },
        { transaction }
      );
    }

    return getStaffById(staffProfile.id);
  });
}

export async function updateStaff(id, { bio, specialties, isActive, name }) {
  const salon = await getSalon();
  const staff = await StaffProfile.findOne({
    where: { id, salonId: salon.id },
    include: [{ association: "user" }],
  });

  if (!staff) {
    throw createError("Staff member not found", 404);
  }

  if (bio !== undefined) staff.bio = bio;
  if (specialties !== undefined) staff.specialties = specialties;
  if (isActive !== undefined) staff.isActive = Boolean(isActive);

  await staff.save();

  if (name && staff.user) {
    staff.user.name = name.trim();
    await staff.user.save();
  }

  return getStaffById(staff.id);
}

export async function assignServices(staffId, serviceIds) {
  const staff = await StaffProfile.findByPk(staffId);
  if (!staff) {
    throw createError("Staff member not found", 404);
  }

  await StaffService.destroy({ where: { staffId: staff.id } });

  if (Array.isArray(serviceIds)) {
    for (const serviceId of serviceIds) {
      await StaffService.create({ staffId: staff.id, serviceId });
    }
  }

  return getStaffById(staff.id);
}

export async function setStaffAvailability(staffId, schedules) {
  const staff = await StaffProfile.findByPk(staffId);
  if (!staff) {
    throw createError("Staff member not found", 404);
  }

  await StaffAvailability.destroy({ where: { staffId: staff.id } });

  if (Array.isArray(schedules)) {
    for (const item of schedules) {
      await StaffAvailability.create({
        staffId: staff.id,
        dayOfWeek: item.dayOfWeek,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
      });
    }
  }

  return getStaffById(staff.id);
}
