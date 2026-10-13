import express from "express";

import notificationController from "../controllers/notification.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-notification",
  authMiddleware,
  notificationController.updateNotificationSettings,
);

router.patch(
  "/update-notification",
  authMiddleware,
  notificationController.updateNotificationSettings,
);

router.get("/settings", authMiddleware, notificationController.getNotificationSettings);

export default router;
