import { Router } from "express";
import sequelize from "../config/database.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    await sequelize.authenticate();

    res.status(200).json({
      success: true,
      message: "SalonFlow API is running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;