import express from "express";

import NotificationController from "../controllers/notification.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import notificationMiddleware from "../middlewares/notification.middleware.js";

const router = express.Router();

router.get(
  "/inbox",
  authMiddleware,
  notificationMiddleware,
  NotificationController.getUserNotifications,
);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  NotificationController.markNotificationRead,
);

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

router.patch(
  "/settings",
  authMiddleware,
  NotificationController.updateNotificationSettings,
);

router.get(
  "/settings",
  authMiddleware,
  NotificationController.getNotificationSettings,
);

export default router;
