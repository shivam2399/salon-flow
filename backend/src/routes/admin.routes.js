import { Router } from "express";
import {
  getDashboardStats,
  listUsers,
  updateUser,
  listAppointments,
  updateAppointmentStatus,
  getBusinessHours,
  updateBusinessHours,
  triggerReminders,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require admin role
router.use(requireAuth, requireRole("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);

router.get("/appointments", listAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatus);

router.get("/business-hours", getBusinessHours);
router.put("/business-hours", updateBusinessHours);

router.post("/reminders/trigger", triggerReminders);

export default router;
