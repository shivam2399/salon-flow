import Razorpay from "razorpay";
import crypto from "crypto";
import Stripe from "stripe";
import { Appointment, Payment, Service, User, StaffProfile, Salon } from "../models/index.js";
import { generateInvoiceNumber, generateInvoicePDF } from "./invoice.service.js";

const stripeApiKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_stripe_key_salonflow";
const stripe = new Stripe(stripeApiKey);

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.includes("mock")) {
    return new Razorpay({ key_id, key_secret });
  }
  return null;
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function processPayment({
  appointmentId,
  customerId,
  paymentMethod = "card",
  transactionId,
}) {
  const appointment = await Appointment.findOne({
    where: { id: appointmentId },
    include: [
      { model: Service, as: "service" },
      { model: User, as: "customer" },
    ],
  });

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  if (appointment.customerId !== customerId) {
    throw createError("You do not have permission to pay for this appointment", 403);
  }

  let payment = await Payment.findOne({ where: { appointmentId } });

  const invoiceNumber = generateInvoiceNumber(appointment.id);
  const txnId = transactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (payment) {
    payment.status = "completed";
    payment.paymentMethod = paymentMethod;
    payment.transactionId = txnId;
    if (!payment.invoiceNumber) {
      payment.invoiceNumber = invoiceNumber;
    }
    await payment.save();
  } else {
    payment = await Payment.create({
      appointmentId: appointment.id,
      amountPaise: appointment.pricePaise,
      currency: "INR",
      paymentMethod,
      status: "completed",
      transactionId: txnId,
      invoiceNumber,
    });
  }

  return payment;
}

// ------------------- RAZORPAY INTEGRATION -------------------

export async function createRazorpayOrder({ appointmentId, customerId }) {
  const appointment = await Appointment.findOne({
    where: { id: appointmentId, customerId },
    include: [{ model: Service, as: "service" }],
  });

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  const razorpay = getRazorpayInstance();

  // If live/test Razorpay API credentials are provided
  if (razorpay) {
    try {
      const order = await razorpay.orders.create({
        amount: appointment.pricePaise, // in paise (e.g. 50000 = Rs 500)
        currency: "INR",
        receipt: `receipt_appt_${appointment.id}`,
        notes: {
          appointmentId: String(appointment.id),
          serviceName: appointment.service?.name,
        },
      });

      return {
        isMock: false,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        appointmentId: appointment.id,
      };
    } catch (err) {
      throw createError(`Razorpay order creation failed: ${err.message}`, 500);
    }
  }

  // Graceful development simulation fallback if no live keys set yet
  const mockOrderId = `order_mock_${Date.now()}_${appointment.id}`;
  return {
    isMock: true,
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_salonflow",
    orderId: mockOrderId,
    amount: appointment.pricePaise,
    currency: "INR",
    appointmentId: appointment.id,
  };
}

export async function verifyRazorpayPayment({
  appointmentId,
  customerId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const appointment = await Appointment.findOne({
    where: { id: appointmentId, customerId },
    include: [{ model: Service, as: "service" }],
  });

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  // If live Razorpay secret is set, verify cryptographic HMAC SHA256 signature
  if (razorpaySecret && !razorpaySecret.includes("mock")) {
    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      throw createError("Invalid Razorpay payment signature", 400);
    }
  }

  const invoiceNumber = generateInvoiceNumber(appointment.id);
  const txnId = razorpayPaymentId || `pay_rzp_${Date.now()}`;

  let payment = await Payment.findOne({ where: { appointmentId: appointment.id } });

  if (payment) {
    payment.status = "completed";
    payment.paymentMethod = "razorpay";
    payment.transactionId = txnId;
    if (!payment.invoiceNumber) {
      payment.invoiceNumber = invoiceNumber;
    }
    await payment.save();
  } else {
    payment = await Payment.create({
      appointmentId: appointment.id,
      amountPaise: appointment.pricePaise,
      currency: "INR",
      paymentMethod: "razorpay",
      status: "completed",
      transactionId: txnId,
      invoiceNumber,
    });
  }

  return payment;
}

// ------------------- STRIPE INTEGRATION -------------------

export async function createStripeSession({ appointmentId, customerId }) {
  const appointment = await Appointment.findOne({
    where: { id: appointmentId, customerId },
    include: [{ model: Service, as: "service" }],
  });

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_mock");

  if (isMock) {
    const txnId = `mock_stripe_${Date.now()}`;
    return {
      isMock: true,
      clientSecret: "mock_secret_test_12345",
      appointmentId: appointment.id,
      amountPaise: appointment.pricePaise,
      currency: "INR",
      checkoutUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/appointments?booked=1&paid=1`,
      transactionId: txnId,
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: appointment.service.name,
              description: `Appointment at SalonFlow`,
            },
            unit_amount: appointment.pricePaise,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/appointments?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/appointments?cancelled_payment=1`,
      metadata: {
        appointmentId: String(appointment.id),
        customerId: String(customerId),
      },
    });

    return {
      isMock: false,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    throw createError(`Stripe checkout error: ${error.message}`, 500);
  }
}

export async function getAppointmentInvoice({ appointmentId, user }) {
  const appointment = await Appointment.findOne({
    where: { id: appointmentId },
    include: [
      { model: Salon, as: "salon" },
      { model: Service, as: "service" },
      {
        model: StaffProfile,
        as: "staff",
        include: [{ model: User, as: "user", attributes: ["name"] }],
      },
      { model: User, as: "customer", attributes: ["id", "name", "email", "phone"] },
      { model: Payment, as: "payment" },
    ],
  });

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  if (user.role !== "admin" && user.role !== "staff" && appointment.customerId !== user.id) {
    throw createError("You do not have permission to view this invoice", 403);
  }

  if (!appointment.payment) {
    const invNum = generateInvoiceNumber(appointment.id);
    const payment = await Payment.create({
      appointmentId: appointment.id,
      amountPaise: appointment.pricePaise,
      currency: "INR",
      paymentMethod: "card",
      status: "completed",
      transactionId: `txn_auto_${appointment.id}`,
      invoiceNumber: invNum,
    });
    appointment.payment = payment;
  }

  const pdfBuffer = await generateInvoicePDF(appointment);
  const invoiceNumber = appointment.payment.invoiceNumber || generateInvoiceNumber(appointment.id);

  return {
    pdfBuffer,
    fileName: `${invoiceNumber}.pdf`,
  };
}
