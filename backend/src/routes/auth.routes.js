import { Router } from "express";

import {
  register,
  login,
  me,
  updateProfile,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", requireAuth, me);
router.get("/profile", requireAuth, me);
router.patch("/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);
router.put("/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);

export default router;
