import { Review, Appointment, Service, StaffProfile, User } from "../models/index.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createReview({
  customerId,
  appointmentId,
  rating,
  comment,
}) {
  const appointment = await Appointment.findOne({
    where: { id: appointmentId, customerId },
  });

  if (!appointment) {
    throw createError("Appointment not found or does not belong to you", 404);
  }

  const existingReview = await Review.findOne({
    where: { appointmentId },
  });

  if (existingReview) {
    throw createError("A review has already been submitted for this appointment", 409);
  }

  const review = await Review.create({
    appointmentId,
    customerId,
    serviceId: appointment.serviceId,
    staffId: appointment.staffId,
    rating: Number(rating),
    comment: comment.trim(),
  });

  return review;
}

export async function getReviews({ serviceId, staffId } = {}) {
  const where = {};
  if (serviceId) where.serviceId = serviceId;
  if (staffId) where.staffId = staffId;

  return Review.findAll({
    where,
    include: [
      {
        model: User,
        as: "customer",
        attributes: ["id", "name"],
      },
      {
        model: Service,
        as: "service",
        attributes: ["id", "name"],
      },
      {
        model: StaffProfile,
        as: "staff",
        include: [{ model: User, as: "user", attributes: ["name"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

export async function respondToReview({ reviewId, staffResponse, user }) {
  const review = await Review.findByPk(reviewId);

  if (!review) {
    throw createError("Review not found", 404);
  }

  if (user.role !== "admin" && user.role !== "staff") {
    throw createError("Only staff or administrators can respond to reviews", 403);
  }

  review.staffResponse = staffResponse.trim();
  review.respondedAt = new Date();
  await review.save();

  return review;
}

