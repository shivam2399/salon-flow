import { Router } from "express";
import {
  listServices,
  getService,
  create,
  update,
  remove,
} from "../controllers/service.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listServices);
router.get("/:id", getService);

// Admin-only endpoints
router.post("/", requireAuth, requireRole("admin"), create);
router.put("/:id", requireAuth, requireRole("admin"), update);
router.delete("/:id", requireAuth, requireRole("admin"), remove);

export default router;
