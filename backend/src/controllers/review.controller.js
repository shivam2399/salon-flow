import {
  createReview,
  getReviews,
  respondToReview,
} from "../services/review.service.js";

export async function listReviews(req, res, next) {
  try {
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined;
    const staffId = req.query.staffId ? Number(req.query.staffId) : undefined;

    const reviews = await getReviews({ serviceId, staffId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitReview(req, res, next) {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "appointmentId, rating, and comment are required",
      });
    }

    const review = await createReview({
      customerId: req.user.id,
      appointmentId: Number(appointmentId),
      rating: Number(rating),
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

export async function replyToReview(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const { staffResponse } = req.body;

    if (!staffResponse) {
      return res.status(400).json({
        success: false,
        message: "staffResponse is required",
      });
    }

    const review = await respondToReview({
      reviewId,
      staffResponse,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Response added successfully",
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

