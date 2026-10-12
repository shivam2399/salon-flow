import {
  getAllUsersAdmin,
  updateUserStatusAdmin,
} from "../services/auth.service.js";
import {
  getAllAppointmentsAdmin,
  updateAppointmentStatusAdmin,
} from "../services/appointment.service.js";
import {
  getBusinessHours as getHoursService,
  updateBusinessHours as updateHoursService,
  getAllServices,
} from "../services/service.service.js";
import { getAllStaff } from "../services/staff.service.js";
import { processUpcomingReminders } from "../services/reminder.service.js";
import { Appointment, User, Service, StaffProfile } from "../models/index.js";

export async function getDashboardStats(req, res, next) {
  try {
    const totalUsers = await User.count({ where: { role: "customer" } });
    const totalStaff = await StaffProfile.count();
    const totalServices = await Service.count({ where: { isActive: true } });
    const totalAppointments = await Appointment.count();

    const completedAppointments = await Appointment.findAll({
      where: { status: "completed" },
      attributes: ["pricePaise"],
    });

    const totalRevenuePaise = completedAppointments.reduce(
      (acc, curr) => acc + (curr.pricePaise || 0),
      0
    );

    const pendingAppointments = await Appointment.count({ where: { status: "pending" } });
    const confirmedAppointments = await Appointment.count({ where: { status: "confirmed" } });
    const cancelledAppointments = await Appointment.count({ where: { status: "cancelled" } });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStaff,
        totalServices,
        totalAppointments,
        totalRevenuePaise,
        statusCounts: {
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments.length,
          cancelled: cancelledAppointments,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await getAllUsersAdmin();
    return res.status(200).json({
      success: true,
      count: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const user = await updateUserStatusAdmin(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAppointments(req, res, next) {
  try {
    const { status, date, staffId } = req.query;
    const appointments = await getAllAppointmentsAdmin({
      status,
      date,
      staffId: staffId ? Number(staffId) : undefined,
    });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: { appointments },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const { status } = req.body;

    const appointment = await updateAppointmentStatusAdmin({
      appointmentId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessHours(req, res, next) {
  try {
    const businessHours = await getHoursService();
    return res.status(200).json({
      success: true,
      data: { businessHours },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusinessHours(req, res, next) {
  try {
    const { hours } = req.body;
    const businessHours = await updateHoursService(hours || []);
    return res.status(200).json({
      success: true,
      message: "Business hours updated successfully",
      data: { businessHours },
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerReminders(req, res, next) {
  try {
    const result = await processUpcomingReminders();
    return res.status(200).json({
      success: true,
      message: "Appointment reminders processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
