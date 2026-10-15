import express from "express";

import NotificationController from "../controllers/notification.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post(
  "/create-notification",
  authMiddleware,
  NotificationController.updateNotificationSettings,
);

router.patch(
  "/update-notification",
  authMiddleware,
  NotificationController.updateNotificationSettings,
);

router.get("/settings", authMiddleware, NotificationController.getNotificationSettings);

export default router;
