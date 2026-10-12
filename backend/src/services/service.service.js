import { Salon, Service, BusinessHour } from "../models/index.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
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

export async function getAllServices(includeInactive = false) {
  const salon = await getSalon();
  const where = { salonId: salon.id };
  if (!includeInactive) {
    where.isActive = true;
  }

  return Service.findAll({
    where,
    attributes: [
      "id",
      "name",
      "slug",
      "description",
      "durationMinutes",
      "pricePaise",
      "isActive",
    ],
    order: [["name", "ASC"]],
  });
}

export async function getServiceById(id) {
  const salon = await getSalon();

  const service = await Service.findOne({
    where: {
      id,
      salonId: salon.id,
    },
    attributes: [
      "id",
      "name",
      "slug",
      "description",
      "durationMinutes",
      "pricePaise",
      "isActive",
    ],
  });

  if (!service) {
    throw createError("Service not found", 404);
  }

  return service;
}

export async function createService({
  name,
  description,
  durationMinutes,
  pricePaise,
  isActive = true,
}) {
  const salon = await getSalon();
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const service = await Service.create({
    salonId: salon.id,
    name: name.trim(),
    slug,
    description: description ? description.trim() : null,
    durationMinutes: Number(durationMinutes),
    pricePaise: Number(pricePaise),
    isActive: Boolean(isActive),
  });

  return service;
}

export async function updateService(id, data) {
  const salon = await getSalon();
  const service = await Service.findOne({
    where: { id, salonId: salon.id },
  });

  if (!service) {
    throw createError("Service not found", 404);
  }

  if (data.name !== undefined) {
    service.name = data.name.trim();
    service.slug = `${slugify(data.name)}-${service.id}`;
  }
  if (data.description !== undefined) service.description = data.description ? data.description.trim() : null;
  if (data.durationMinutes !== undefined) service.durationMinutes = Number(data.durationMinutes);
  if (data.pricePaise !== undefined) service.pricePaise = Number(data.pricePaise);
  if (data.isActive !== undefined) service.isActive = Boolean(data.isActive);

  await service.save();
  return service;
}

export async function deleteService(id) {
  const salon = await getSalon();
  const service = await Service.findOne({
    where: { id, salonId: salon.id },
  });

  if (!service) {
    throw createError("Service not found", 404);
  }

  // Soft-deactivate to avoid breaking existing appointment records
  service.isActive = false;
  await service.save();
  return { success: true, message: "Service deactivated successfully" };
}

export async function getBusinessHours() {
  const salon = await getSalon();
  return BusinessHour.findAll({
    where: { salonId: salon.id },
    order: [["dayOfWeek", "ASC"]],
  });
}

export async function updateBusinessHours(hoursArray) {
  const salon = await getSalon();

  for (const item of hoursArray) {
    const { dayOfWeek, opensAt, closesAt, isClosed } = item;
    if (dayOfWeek >= 0 && dayOfWeek <= 6) {
      await BusinessHour.upsert({
        salonId: salon.id,
        dayOfWeek,
        opensAt: isClosed ? null : opensAt,
        closesAt: isClosed ? null : closesAt,
        isClosed: Boolean(isClosed),
      });
    }
  }

  return BusinessHour.findAll({
    where: { salonId: salon.id },
    order: [["dayOfWeek", "ASC"]],
  });
}
