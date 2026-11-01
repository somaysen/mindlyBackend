import { Router } from "express";
import scheduleController from "../controllers/schedule.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/today", authMiddleware, (req, res, next) =>
  scheduleController.getTodaySchedule(req, res, next),
);

export default router;
