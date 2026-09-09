import express from "express";

import UserNotification from "../controllers/notificaton.controller.js";
import authMiddleware from "../middlewares/auth.middlewar.js";

const router = express.Router();

router.post(
  "/create-notification",
  authMiddleware,
  UserNotification.permissionNotification
);

export default router;