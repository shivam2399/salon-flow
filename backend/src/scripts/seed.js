import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  sequelize,
  Salon,
  User,
  StaffProfile,
  Service,
  StaffService,
  BusinessHour,
  StaffAvailability,
  Appointment,
  Payment,
  Review,
} from "../models/index.js";

async function seed() {
  const password = process.env.SEED_DEMO_PASSWORD;

  if (!password) {
    throw new Error("SEED_DEMO_PASSWORD is missing from .env");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [salon] = await Salon.findOrCreate({
    where: { slug: "salonflow-demo" },
    defaults: {
      name: "SalonFlow Studio",
      slug: "salonflow-demo",
      address: "Bhilai, Chhattisgarh, India",
      email: "hello@salonflow.local",
      phone: "+91 98765 43210",
      timezone: "Asia/Kolkata",
    },
  });

  const demoUsers = [
    { name: "Salon Admin", email: "admin@salonflow.local", role: "admin", phone: "+91 9800000001" },
    { name: "Aarav Sharma", email: "aarav@salonflow.local", role: "staff", phone: "+91 9800000002" },
    { name: "Priya Verma", email: "priya@salonflow.local", role: "staff", phone: "+91 9800000003" },
    {
      name: "Demo Customer",
      email: "customer@salonflow.local",
      role: "customer",
      phone: "+91 9800000004",
      preferences: { preferredStylist: "Aarav Sharma", remindersEmail: true },
    },
  ];

  const users = {};

  for (const data of demoUsers) {
    const [user] = await User.findOrCreate({
      where: { email: data.email },
      defaults: {
        ...data,
        salonId: salon.id,
        passwordHash,
      },
    });

    users[data.email] = user;
  }

  const staffUsers = [
    users["aarav@salonflow.local"],
    users["priya@salonflow.local"],
  ];

  const staffProfiles = [];

  for (const user of staffUsers) {
    const [profile] = await StaffProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        salonId: salon.id,
        bio: `Senior stylist at ${salon.name} with expertise in modern haircuts and grooming.`,
        specialties: ["Hair styling", "Beard sculpting", "Hair care"],
      },
    });

    staffProfiles.push(profile);
  }

  const demoServices = [
    {
      name: "Classic Haircut",
      slug: "classic-haircut",
      durationMinutes: 45,
      pricePaise: 50000,
      description: "A precision haircut tailored to your face shape and personal style.",
    },
    {
      name: "Hair Styling & Blowdry",
      slug: "hair-styling-blowdry",
      durationMinutes: 30,
      pricePaise: 40000,
      description: "Professional wash, blowout, and finish for any occasion.",
    },
    {
      name: "Nourishing Hair Treatment",
      slug: "nourishing-hair-treatment",
      durationMinutes: 60,
      pricePaise: 120000,
      description: "Deep conditioning and revitalizing scalp spa treatment.",
    },
    {
      name: "Beard Grooming & Shape",
      slug: "beard-grooming-shape",
      durationMinutes: 30,
      pricePaise: 35000,
      description: "Hot towel treatment, beard trimming, razor line-up, and nourishing oil.",
    },
  ];

  const services = [];

  for (const data of demoServices) {
    const [service] = await Service.findOrCreate({
      where: { salonId: salon.id, slug: data.slug },
      defaults: { ...data, salonId: salon.id },
    });

    services.push(service);
  }

  for (const staff of staffProfiles) {
    for (const service of services) {
      await StaffService.findOrCreate({
        where: { staffId: staff.id, serviceId: service.id },
        defaults: { staffId: staff.id, serviceId: service.id },
      });
    }
  }

  for (let day = 0; day <= 6; day++) {
    await BusinessHour.findOrCreate({
      where: { salonId: salon.id, dayOfWeek: day },
      defaults: {
        salonId: salon.id,
        dayOfWeek: day,
        opensAt: day === 0 ? null : "09:00:00",
        closesAt: day === 0 ? null : "20:00:00",
        isClosed: day === 0,
      },
    });
  }

  for (const staff of staffProfiles) {
    for (let day = 1; day <= 6; day++) {
      await StaffAvailability.findOrCreate({
        where: { staffId: staff.id, dayOfWeek: day },
        defaults: {
          staffId: staff.id,
          dayOfWeek: day,
          startsAt: "10:00:00",
          endsAt: "18:00:00",
        },
      });
    }
  }

  // Seed sample completed appointment with payment and review
  const customer = users["customer@salonflow.local"];
  const aarav = staffProfiles[0];
  const priya = staffProfiles[1];
  const haircutService = services[0];
  const stylingService = services[1];

  const pastDate1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const pastDate2 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  const [appt1] = await Appointment.findOrCreate({
    where: {
      customerId: customer.id,
      serviceId: haircutService.id,
      staffId: aarav.id,
    },
    defaults: {
      salonId: salon.id,
      customerId: customer.id,
      serviceId: haircutService.id,
      staffId: aarav.id,
      startTime: pastDate1,
      endTime: new Date(pastDate1.getTime() + 45 * 60 * 1000),
      pricePaise: haircutService.pricePaise,
      durationMinutes: haircutService.durationMinutes,
      status: "completed",
      notes: "First time haircut visit",
    },
  });

  await Payment.findOrCreate({
    where: { appointmentId: appt1.id },
    defaults: {
      appointmentId: appt1.id,
      amountPaise: appt1.pricePaise,
      currency: "INR",
      paymentMethod: "card",
      status: "completed",
      transactionId: `txn_demo_${appt1.id}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-00001`,
    },
  });

  await Review.findOrCreate({
    where: { appointmentId: appt1.id },
    defaults: {
      appointmentId: appt1.id,
      customerId: customer.id,
      serviceId: haircutService.id,
      staffId: aarav.id,
      rating: 5,
      comment: "Aarav did an incredible job! The haircut was clean, precise, and exactly what I requested.",
      staffResponse: "Thank you so much! It was a pleasure having you. See you on your next visit!",
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const [appt2] = await Appointment.findOrCreate({
    where: {
      customerId: customer.id,
      serviceId: stylingService.id,
      staffId: priya.id,
    },
    defaults: {
      salonId: salon.id,
      customerId: customer.id,
      serviceId: stylingService.id,
      staffId: priya.id,
      startTime: pastDate2,
      endTime: new Date(pastDate2.getTime() + 30 * 60 * 1000),
      pricePaise: stylingService.pricePaise,
      durationMinutes: stylingService.durationMinutes,
      status: "completed",
      notes: "Blowout for an evening function",
    },
  });

  await Payment.findOrCreate({
    where: { appointmentId: appt2.id },
    defaults: {
      appointmentId: appt2.id,
      amountPaise: appt2.pricePaise,
      currency: "INR",
      paymentMethod: "stripe",
      status: "completed",
      transactionId: `txn_stripe_${appt2.id}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-00002`,
    },
  });

  await Review.findOrCreate({
    where: { appointmentId: appt2.id },
    defaults: {
      appointmentId: appt2.id,
      customerId: customer.id,
      serviceId: stylingService.id,
      staffId: priya.id,
      rating: 5,
      comment: "Priya gave me the best blowout styling. It lasted all evening and looked stunning!",
      staffResponse: "So happy you loved the style! Thank you for the wonderful feedback.",
      respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Demo data is ready.");
  console.log("Demo accounts:");
  console.log("  Admin:    admin@salonflow.local");
  console.log("  Staff:    aarav@salonflow.local");
  console.log("  Staff:    priya@salonflow.local");
  console.log("  Customer: customer@salonflow.local");
  console.log("Use password set in SEED_DEMO_PASSWORD (e.g. ChangeThisForLocalDemo123!)");
}

try {
  await sequelize.authenticate();
  await seed();
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
