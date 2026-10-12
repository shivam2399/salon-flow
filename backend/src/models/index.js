
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Salon = sequelize.define(
  "Salon",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    address: DataTypes.TEXT,
    phone: DataTypes.STRING(20),
    email: DataTypes.STRING(255),
    timezone: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: "Asia/Kolkata",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { tableName: "salons", underscored: true }
);

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    salonId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: DataTypes.STRING(20),
    role: {
      type: DataTypes.ENUM("customer", "staff", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  { tableName: "users", underscored: true }
);

export const StaffProfile = sequelize.define(
  "StaffProfile",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    salonId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    bio: DataTypes.TEXT,
    specialties: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { tableName: "staff_profiles", underscored: true }
);

export const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    salonId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    description: DataTypes.TEXT,
    durationMinutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    pricePaise: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "services",
    underscored: true,
    indexes: [
      { unique: true, fields: ["salon_id", "slug"] },
    ],
  }
);

export const StaffService = sequelize.define(
  "StaffService",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "staff_services",
    underscored: true,
    indexes: [
      { unique: true, fields: ["staff_id", "service_id"] },
    ],
  }
);

export const BusinessHour = sequelize.define(
  "BusinessHour",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    salonId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    opensAt: DataTypes.TIME,
    closesAt: DataTypes.TIME,
    isClosed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "business_hours",
    underscored: true,
    indexes: [
      { unique: true, fields: ["salon_id", "day_of_week"] },
    ],
  }
);

export const StaffAvailability = sequelize.define(
  "StaffAvailability",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    startsAt: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endsAt: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  { tableName: "staff_availabilities", underscored: true }
);

export const Appointment = sequelize.define(
  "Appointment",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    salonId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pricePaise: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    durationMinutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show"
      ),
      allowNull: false,
      defaultValue: "confirmed",
    },
    notes: DataTypes.TEXT,
  },
  {
    tableName: "appointments",
    underscored: true,
    indexes: [
      { fields: ["customer_id", "start_time"] },
      { fields: ["staff_id", "start_time", "end_time"] },
      { fields: ["salon_id", "status"] },
    ],
  }
);

// Relationships

Salon.hasMany(User, { foreignKey: "salonId", as: "users" });
User.belongsTo(Salon, { foreignKey: "salonId", as: "salon" });

Salon.hasMany(Service, { foreignKey: "salonId", as: "services" });
Service.belongsTo(Salon, { foreignKey: "salonId", as: "salon" });

Salon.hasMany(StaffProfile, { foreignKey: "salonId", as: "staff" });
StaffProfile.belongsTo(Salon, { foreignKey: "salonId", as: "salon" });

User.hasOne(StaffProfile, { foreignKey: "userId", as: "staffProfile" });
StaffProfile.belongsTo(User, { foreignKey: "userId", as: "user" });

StaffProfile.belongsToMany(Service, {
  through: StaffService,
  foreignKey: "staffId",
  otherKey: "serviceId",
  as: "services",
});

Service.belongsToMany(StaffProfile, {
  through: StaffService,
  foreignKey: "serviceId",
  otherKey: "staffId",
  as: "staff",
});

Salon.hasMany(BusinessHour, {
  foreignKey: "salonId",
  as: "businessHours",
});
BusinessHour.belongsTo(Salon, { foreignKey: "salonId", as: "salon" });

StaffProfile.hasMany(StaffAvailability, {
  foreignKey: "staffId",
  as: "availability",
});
StaffAvailability.belongsTo(StaffProfile, {
  foreignKey: "staffId",
  as: "staff",
});

Salon.hasMany(Appointment, {
  foreignKey: "salonId",
  as: "appointments",
});
Appointment.belongsTo(Salon, { foreignKey: "salonId", as: "salon" });

User.hasMany(Appointment, {
  foreignKey: "customerId",
  as: "appointments",
});
Appointment.belongsTo(User, {
  foreignKey: "customerId",
  as: "customer",
});

StaffProfile.hasMany(Appointment, {
  foreignKey: "staffId",
  as: "appointments",
});
Appointment.belongsTo(StaffProfile, {
  foreignKey: "staffId",
  as: "staff",
});

Service.hasMany(Appointment, {
  foreignKey: "serviceId",
  as: "appointments",
});
Appointment.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

export const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    amountPaise: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "INR",
    },
    paymentMethod: {
      type: DataTypes.ENUM("card", "upi", "cash", "stripe", "razorpay"),
      allowNull: false,
      defaultValue: "card",
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    transactionId: DataTypes.STRING(255),
    invoiceNumber: DataTypes.STRING(100),
  },
  {
    tableName: "payments",
    underscored: true,
    indexes: [
      { fields: ["appointment_id"] },
      { fields: ["status"] },
    ],
  }
);

export const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    staffResponse: DataTypes.TEXT,
    respondedAt: DataTypes.DATE,
  },
  {
    tableName: "reviews",
    underscored: true,
    indexes: [
      { fields: ["service_id"] },
      { fields: ["staff_id"] },
    ],
  }
);

// Payment associations
Appointment.hasOne(Payment, { foreignKey: "appointmentId", as: "payment" });
Payment.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });

// Review associations
Appointment.hasOne(Review, { foreignKey: "appointmentId", as: "review" });
Review.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });

User.hasMany(Review, { foreignKey: "customerId", as: "reviews" });
Review.belongsTo(User, { foreignKey: "customerId", as: "customer" });

Service.hasMany(Review, { foreignKey: "serviceId", as: "reviews" });
Review.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

StaffProfile.hasMany(Review, { foreignKey: "staffId", as: "reviews" });
Review.belongsTo(StaffProfile, { foreignKey: "staffId", as: "staff" });

export { sequelize };
