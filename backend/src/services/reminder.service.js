import cron from "node-cron";
import { Op } from "sequelize";
import { DateTime } from "luxon";
import { Appointment, User, Service, StaffProfile, Salon } from "../models/index.js";
import { sendAppointmentReminder, sendSMS } from "./notification.service.js";

// Keep track of appointments that were already reminded in memory
const remindedAppointmentIds = new Set();

export async function processUpcomingReminders() {
  try {
    const now = new Date();
    // Look for appointments scheduled between 1 hour and 25 hours from now
    const windowStart = now;
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAppointments = await Appointment.findAll({
      where: {
        status: "confirmed",
        startTime: {
          [Op.gte]: windowStart,
          [Op.lte]: windowEnd,
        },
      },
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Service,
          as: "service",
          attributes: ["id", "name"],
        },
        {
          model: StaffProfile,
          as: "staff",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["name"],
            },
          ],
        },
        {
          model: Salon,
          as: "salon",
          attributes: ["name"],
        },
      ],
    });

    let sentCount = 0;
    for (const appt of upcomingAppointments) {
      if (remindedAppointmentIds.has(appt.id)) {
        continue;
      }

      if (appt.customer?.email) {
        await sendAppointmentReminder({
          to: appt.customer.email,
          customerName: appt.customer.name,
          serviceName: appt.service?.name || "Salon Service",
          staffName: appt.staff?.user?.name || "Stylist",
          startTime: appt.startTime,
          salonName: appt.salon?.name || "SalonFlow Studio",
        });

        if (appt.customer?.phone) {
          sendSMS({
            to: appt.customer.phone,
            body: `Reminder: You have an upcoming appointment for ${appt.service?.name || "Salon Service"} at ${appt.salon?.name || "SalonFlow"} at ${new Date(appt.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`,
          }).catch((err) => console.error("SMS reminder error:", err.message));
        }

        remindedAppointmentIds.add(appt.id);
        sentCount++;
      }
    }

    if (sentCount > 0) {
      console.log(`[Cron Reminder] Sent ${sentCount} upcoming appointment reminder emails.`);
    }

    return { processed: upcomingAppointments.length, sent: sentCount };
  } catch (error) {
    console.error("[Cron Reminder] Error processing appointment reminders:", error);
    return { error: error.message };
  }
}

export function startReminderCronJob() {
  // Run every hour at minute 0: '0 * * * *'
  // Also runs initially on server start
  const schedule = "0 * * * *";
  const job = cron.schedule(schedule, async () => {
    console.log("[Cron Reminder] Running scheduled appointment reminder check...");
    await processUpcomingReminders();
  });

  console.log(`[Cron Reminder] Appointment reminder cron job scheduled with pattern: ${schedule}`);
  return job;
}

