import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Salon, User } from "../models/index.js";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }

  return secret;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    salonId: user.salonId,
    preferences: user.preferences || {},
  };
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "salonflow-api",
      audience: "salonflow-client",
    }
  );
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function registerUser({ name, email, password, phone, preferences }) {
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw createError("An account with this email already exists", 409);
  }

  const salon = await Salon.findOne({
    where: {
      slug: process.env.SALON_SLUG || "salonflow-demo",
      isActive: true,
    },
  });

  if (!salon) {
    throw createError("The salon is not configured", 500);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;

  try {
    user = await User.create({
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "customer",
      salonId: salon.id,
      preferences: preferences || {},
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw createError("An account with this email already exists", 409);
    }

    throw error;
  }

  return {
    user: publicUser(user),
    token: createAccessToken(user),
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw createError("This account is inactive", 403);
  }

  return {
    user: publicUser(user),
    token: createAccessToken(user),
  };
}

export async function getUserProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError("User not found", 404);
  }
  return publicUser(user);
}

export async function updateUserProfile(userId, { name, phone, preferences }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (preferences !== undefined) {
    user.preferences = {
      ...(user.preferences || {}),
      ...preferences,
    };
  }

  await user.save();
  return publicUser(user);
}

export async function getAllUsersAdmin() {
  const users = await User.findAll({
    attributes: ["id", "name", "email", "phone", "role", "isActive", "createdAt"],
    order: [["createdAt", "DESC"]],
  });
  return users;
}

export async function updateUserStatusAdmin(userId, { isActive, role }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  if (isActive !== undefined) user.isActive = Boolean(isActive);
  if (role !== undefined && ["customer", "staff", "admin"].includes(role)) {
    user.role = role;
  }

  await user.save();
  return publicUser(user);
}
