import { Router } from "express";
import {
  listReviews,
  submitReview,
  replyToReview,
} from "../controllers/review.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listReviews);
router.post("/", requireAuth, submitReview);
router.post("/:id/response", requireAuth, requireRole("admin", "staff"), replyToReview);

export default router;

