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
  onDelete: "CASCADE",
});

export async function up({ context: qi }) {
  // 1. Add preferences column to users
  await qi.addColumn("users", "preferences", {
    type: DataTypes.JSON,
    allowNull: true,
  });

  // 2. Create payments table
  await qi.createTable("payments", {
    id,
    appointment_id: foreignKey("appointments", false),
    amount_paise: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "INR",
    },
    payment_method: {
      type: DataTypes.ENUM("card", "upi", "cash", "stripe", "razorpay"),
      allowNull: false,
      defaultValue: "card",
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ...timestamps(),
  });

  await qi.addIndex("payments", ["appointment_id"], {
    name: "payments_appointment_id_idx",
  });

  await qi.addIndex("payments", ["status"], {
    name: "payments_status_idx",
  });

  // 3. Create reviews table
  await qi.createTable("reviews", {
    id,
    appointment_id: {
      ...foreignKey("appointments", false),
      unique: true,
    },
    customer_id: foreignKey("users", false),
    service_id: foreignKey("services", false),
    staff_id: foreignKey("staff_profiles", false),
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    staff_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ...timestamps(),
  });

  await qi.addIndex("reviews", ["service_id"], {
    name: "reviews_service_id_idx",
  });

  await qi.addIndex("reviews", ["staff_id"], {
    name: "reviews_staff_id_idx",
  });
}

export async function down({ context: qi }) {
  await qi.dropTable("reviews");
  await qi.dropTable("payments");
  await qi.removeColumn("users", "preferences");
}

