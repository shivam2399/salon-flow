
import { getAvailableSlots } from "../services/availability.service.js";

export async function listAvailability(req, res, next) {
  try {
    const serviceId = Number(req.query.serviceId);
    const { date } = req.query;

    const staffId =
      req.query.staffId === undefined
        ? undefined
        : Number(req.query.staffId);

    if (!Number.isSafeInteger(serviceId) || serviceId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid serviceId is required",
      });
    }

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        success: false,
        message: "A date is required in YYYY-MM-DD format",
      });
    }

    if (
      staffId !== undefined &&
      (!Number.isSafeInteger(staffId) || staffId < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "staffId must be a positive integer",
      });
    }

    const availability = await getAvailableSlots({
      serviceId,
      date,
      staffId,
    });

    return res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
}
