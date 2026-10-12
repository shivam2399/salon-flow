
import { DataTypes } from "sequelize";

const id = {
  type: DataTypes.INTEGER.UNSIGNED,
  autoIncrement: true,
  primaryKey: true,
};

const timestamps = () => ({
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

const foreignKey = (table, allowNull = false) => ({
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull,
  references: { model: table, key: "id" },
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});

export async function up({ context: qi }) {
  await qi.createTable("salons", {
    id,
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    address: DataTypes.TEXT,
    phone: DataTypes.STRING(20),
    email: DataTypes.STRING(255),
    timezone: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: "Asia/Kolkata",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ...timestamps(),
  });

  await qi.createTable("users", {
    id,
    salon_id: foreignKey("salons", true),
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    phone: DataTypes.STRING(20),
    role: {
      type: DataTypes.ENUM("customer", "staff", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ...timestamps(),
  });

  await qi.createTable("staff_profiles", {
    id,
    user_id: {
      ...foreignKey("users"),
      unique: true,
    },
    salon_id: foreignKey("salons"),
    bio: DataTypes.TEXT,
    specialties: { type: DataTypes.JSON, allowNull: false },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ...timestamps(),
  });

  await qi.createTable("services", {
    id,
    salon_id: foreignKey("salons"),
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    description: DataTypes.TEXT,
    duration_minutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    price_paise: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ...timestamps(),
  });

  await qi.addIndex("services", ["salon_id", "slug"], {
    unique: true,
    name: "services_salon_slug_unique",
  });

  await qi.createTable("staff_services", {
    id,
    staff_id: foreignKey("staff_profiles"),
    service_id: foreignKey("services"),
    ...timestamps(),
  });

  await qi.addIndex("staff_services", ["staff_id", "service_id"], {
    unique: true,
    name: "staff_services_pair_unique",
  });

  await qi.createTable("business_hours", {
    id,
    salon_id: foreignKey("salons"),
    day_of_week: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    opens_at: DataTypes.TIME,
    closes_at: DataTypes.TIME,
    is_closed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ...timestamps(),
  });

  await qi.addIndex("business_hours", ["salon_id", "day_of_week"], {
    unique: true,
    name: "business_hours_salon_day_unique",
  });

  await qi.createTable("staff_availabilities", {
    id,
    staff_id: foreignKey("staff_profiles"),
    day_of_week: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    starts_at: { type: DataTypes.TIME, allowNull: false },
    ends_at: { type: DataTypes.TIME, allowNull: false },
    ...timestamps(),
  });

  await qi.createTable("appointments", {
    id,
    salon_id: foreignKey("salons"),
    customer_id: foreignKey("users"),
    staff_id: foreignKey("staff_profiles"),
    service_id: foreignKey("services"),
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    price_paise: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    duration_minutes: {
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
    ...timestamps(),
  });

  await qi.addIndex("appointments", ["customer_id", "start_time"], {
    name: "appointments_customer_start_idx",
  });

  await qi.addIndex("appointments", ["staff_id", "start_time", "end_time"], {
    name: "appointments_staff_time_idx",
  });

  await qi.addIndex("appointments", ["salon_id", "status"], {
    name: "appointments_salon_status_idx",
  });
}

export async function down({ context: qi }) {
  await qi.dropTable("appointments");
  await qi.dropTable("staff_availabilities");
  await qi.dropTable("business_hours");
  await qi.dropTable("staff_services");
  await qi.dropTable("services");
  await qi.dropTable("staff_profiles");
  await qi.dropTable("users");
  await qi.dropTable("salons");
}
