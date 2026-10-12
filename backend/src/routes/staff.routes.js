import { Router } from "express";
import {
  listStaff,
  getStaff,
  create,
  update,
  assignServicesToStaff,
  updateAvailability,
} from "../controllers/staff.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listStaff);
router.get("/:id", getStaff);

// Admin-only endpoints
router.post("/", requireAuth, requireRole("admin"), create);
router.put("/:id", requireAuth, requireRole("admin"), update);
router.post("/:id/services", requireAuth, requireRole("admin"), assignServicesToStaff);
router.put("/:id/availability", requireAuth, requireRole("admin"), updateAvailability);

export default router;
