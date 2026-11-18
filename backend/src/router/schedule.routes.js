import { Router } from "express";
import scheduleController from "../controllers/schedule.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = Router();

router.get("/today", authMiddleware, validateRequest(validation.scheduleToday), (req, res, next) =>
  scheduleController.getTodaySchedule(req, res, next),
);

export default router;
