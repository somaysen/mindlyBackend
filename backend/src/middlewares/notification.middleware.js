import Notification from "../models/notification.model.js";
import UserNotification from "../models/userNotification.model.js";
import AppError from "../utils/error.js";

const channelByNotificationType = {
  task_reminder: "taskReminders",
};

const isTaskCompleted = (task) =>
  task?.completed === true || task?.status?.toLowerCase() === "completed";

const notificationMiddleware = async (req, _res, next) => {
  const userId = req.auth?.id || req.auth?._id;
  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const settings = await Notification.findOne({ user: userId }).select(
      "notificationsEnabled taskReminders.enabled",
    );

    if (settings?.notificationsEnabled === false) {
      req.userNotifications = [];
      return next();
    }

    const query = { user: userId };
    if (req.query.includeScheduled !== "true") {
      query.scheduledFor = { $lte: new Date() };
    }

    const notifications = await UserNotification.find(query)
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(50)
      .populate("task", "taskName status completed");

    req.userNotifications = notifications.filter((notification) => {
      const channel = channelByNotificationType[notification.type];
      if (!channel || settings?.[channel]?.enabled === false) {
        return false;
      }

      if (notification.type === "task_reminder") {
        return notification.task && !isTaskCompleted(notification.task);
      }

      return true;
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

export default notificationMiddleware;
