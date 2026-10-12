import {
  createAppointment as createAppointmentService,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "../services/appointment.service.js";
import {
  processPayment,
  createStripeSession,
  getAppointmentInvoice,
  createRazorpayOrder as createRazorpayOrderService,
  verifyRazorpayPayment as verifyRazorpayPaymentService,
} from "../services/payment.service.js";

export async function bookAppointment(req, res, next) {
  try {
    const appointment = await createAppointmentService({
      customerId: req.user.id,
      serviceId: req.body.serviceId,
      staffId: req.body.staffId,
      startTime: req.body.startTime,
      notes: req.body.notes,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyAppointments(req, res, next) {
  try {
    const appointments = await getMyAppointments(req.user.id);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: { appointments },
    });
  } catch (error) {
    next(error);
  }
}

export const cancel = async (req, res, next) => {
  try {
    const appointment = await cancelAppointment({
      appointmentId: Number(req.params.id),
      customerId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

export const reschedule = async (req, res, next) => {
  try {
    const appointment = await rescheduleAppointment({
      appointmentId: Number(req.params.id),
      customerId: req.user.id,
      newStartTime: req.body.startTime,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully.",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

export async function payAppointment(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const { paymentMethod, transactionId } = req.body;

    const payment = await processPayment({
      appointmentId,
      customerId: req.user.id,
      paymentMethod,
      transactionId,
    });

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
}

// ------------------- RAZORPAY CONTROLLERS -------------------

export async function createRazorpayOrder(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const orderData = await createRazorpayOrderService({
      appointmentId,
      customerId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyRazorpay(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await verifyRazorpayPaymentService({
      appointmentId,
      customerId: req.user.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return res.status(200).json({
      success: true,
      message: "Razorpay payment verified and recorded successfully",
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
}

// ------------------- STRIPE CONTROLLER -------------------

export async function createStripeCheckout(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const session = await createStripeSession({
      appointmentId,
      customerId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

// ------------------- INVOICE CONTROLLER -------------------

export async function downloadInvoice(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const { pdfBuffer, fileName } = await getAppointmentInvoice({
      appointmentId,
      user: req.user,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
