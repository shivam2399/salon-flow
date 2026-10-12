import { Router } from "express";

import {
  bookAppointment,
  listMyAppointments,
  cancel,
  reschedule,
  payAppointment,
  createRazorpayOrder,
  verifyRazorpay,
  createStripeCheckout,
  downloadInvoice,
} from "../controllers/appointment.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
} from "../validators/appointment.validator.js";

const router = Router();

router.get("/my", requireAuth, listMyAppointments);

router.post(
  "/",
  requireAuth,
  validateBody(createAppointmentSchema),
  bookAppointment
);

router.patch("/:id/cancel", requireAuth, cancel);
router.patch(
  "/:id/reschedule",
  requireAuth,
  validateBody(rescheduleAppointmentSchema),
  reschedule
);

// Payment & Invoice endpoints
router.post("/:id/pay", requireAuth, payAppointment);
router.post("/:id/payment", requireAuth, payAppointment);
router.post("/:id/razorpay/order", requireAuth, createRazorpayOrder);
router.post("/:id/razorpay/verify", requireAuth, verifyRazorpay);
router.post("/:id/stripe-session", requireAuth, createStripeCheckout);
router.get("/:id/invoice", requireAuth, downloadInvoice);

export default router;
