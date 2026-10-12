import nodemailer from "nodemailer";

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback using Ethereal test account or json/console transport
    const testAccount = await nodemailer.createTestAccount().catch(() => null);
    if (testAccount) {
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Notification] Created Ethereal test email account: ${testAccount.user}`);
    } else {
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"SalonFlow" <no-reply@salonflow.com>',
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log(`[Notification] Email sent to ${to}: "${subject}" (Message ID: ${info.messageId})`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Notification] Email Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Notification] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function sendBookingConfirmation({
  to,
  customerName,
  serviceName,
  staffName,
  startTime,
  salonName = "SalonFlow Studio",
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
      <h2 style="color: #e11d48; margin-top: 0;">Appointment Confirmed! ✂️</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Your appointment at <strong>${salonName}</strong> has been successfully booked.</p>
      <div style="background-color: #fff1f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Service:</strong> ${serviceName}</p>
        <p style="margin: 6px 0;"><strong>Stylist:</strong> ${staffName}</p>
        <p style="margin: 6px 0;"><strong>Date & Time:</strong> ${new Date(startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })}</p>
      </div>
      <p>Need to reschedule or cancel? You can manage your bookings anytime in your account.</p>
      <p style="color: #78716c; font-size: 13px; margin-top: 30px;">Thank you for choosing ${salonName}!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Booking Confirmed: ${serviceName} at ${salonName}`,
    html,
    text: `Hello ${customerName}, your appointment for ${serviceName} with ${staffName} on ${startTime} is confirmed.`,
  });
}

export async function sendRescheduleConfirmation({
  to,
  customerName,
  serviceName,
  staffName,
  newStartTime,
  salonName = "SalonFlow Studio",
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
      <h2 style="color: #0284c7; margin-top: 0;">Appointment Rescheduled 🗓️</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Your appointment has been rescheduled to a new time at <strong>${salonName}</strong>.</p>
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Service:</strong> ${serviceName}</p>
        <p style="margin: 6px 0;"><strong>Stylist:</strong> ${staffName}</p>
        <p style="margin: 6px 0;"><strong>New Date & Time:</strong> ${new Date(newStartTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })}</p>
      </div>
      <p style="color: #78716c; font-size: 13px; margin-top: 30px;">Thank you for choosing ${salonName}!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Appointment Rescheduled: ${serviceName} at ${salonName}`,
    html,
    text: `Hello ${customerName}, your appointment for ${serviceName} has been rescheduled to ${newStartTime}.`,
  });
}

export async function sendCancellationNotification({
  to,
  customerName,
  serviceName,
  startTime,
  salonName = "SalonFlow Studio",
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
      <h2 style="color: #ef4444; margin-top: 0;">Appointment Cancelled</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Your appointment for <strong>${serviceName}</strong> originally scheduled for ${new Date(startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} has been cancelled.</p>
      <p>We hope to see you again soon! You can rebook anytime on our website.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Appointment Cancelled: ${serviceName}`,
    html,
    text: `Hello ${customerName}, your appointment for ${serviceName} has been cancelled.`,
  });
}

export async function sendAppointmentReminder({
  to,
  customerName,
  serviceName,
  staffName,
  startTime,
  salonName = "SalonFlow Studio",
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
      <h2 style="color: #d97706; margin-top: 0;">Reminder: Upcoming Appointment ⏰</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>This is a friendly reminder for your upcoming salon appointment today:</p>
      <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Service:</strong> ${serviceName}</p>
        <p style="margin: 6px 0;"><strong>Stylist:</strong> ${staffName}</p>
        <p style="margin: 6px 0;"><strong>Date & Time:</strong> ${new Date(startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })}</p>
      </div>
      <p>We look forward to seeing you at ${salonName}!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Reminder: Upcoming Appointment for ${serviceName}`,
    html,
    text: `Hello ${customerName}, this is a reminder for your upcoming appointment for ${serviceName} with ${staffName} on ${startTime}.`,
  });
}

