import express from "express";

import NotificationController from "../controllers/notification.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import notificationMiddleware from "../middlewares/notification.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.get(
  "/inbox",
  authMiddleware,
  validateRequest(validation.notificationInbox),
  notificationMiddleware,
  NotificationController.getUserNotifications,
);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  validateRequest(validation.notificationId),
  NotificationController.markNotificationRead,
);

router.post(
  "/create-notification",
  authMiddleware,
  validateRequest(validation.notificationSettings),
  NotificationController.updateNotificationSettings,
);

router.patch(
  "/update-notification",
  authMiddleware,
  validateRequest(validation.notificationSettings),
  NotificationController.updateNotificationSettings,
);

router.patch(
  "/settings",
  authMiddleware,
  validateRequest(validation.notificationSettings),
  NotificationController.updateNotificationSettings,
);

router.get(
  "/settings",
  authMiddleware,
  NotificationController.getNotificationSettings,
);

export default router;
