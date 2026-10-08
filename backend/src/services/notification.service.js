
import Notification from "../models/notificaton.model.js";

class NotificationService {
  // Get notification settings
  getNotificationSettings = async (userId) => {
    const settings = await Notification.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return {
      notificationId: settings._id,
      settings,
    };
  };

  // Create / update notification settings
  updateNotificationSettings = async (userId, data = {}) => {
    const allowedData = {};

    if (typeof data.notificationsEnabled === "boolean") {
      allowedData.notificationsEnabled =
        data.notificationsEnabled;
    }

    if (typeof data.taskReminders === "boolean") {
      allowedData["taskReminders.enabled"] =
        data.taskReminders;
    }

    if (typeof data.focusSessions === "boolean") {
      allowedData["focusSessions.enabled"] =
        data.focusSessions;
    }

    if (typeof data.weeklyReflections === "boolean") {
      allowedData["weeklyReflections.enabled"] =
        data.weeklyReflections;
    }

    if (typeof data.emailNotifications === "boolean") {
      allowedData["emailNotifications.enabled"] = data.emailNotifications;
    }

    if (typeof data.pushNotifications === "boolean") {
      allowedData["pushNotifications.enabled"] = data.pushNotifications;
    }

    const settings = await Notification.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $set: allowedData,
        $setOnInsert: { user: userId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return {
      notificationId: settings._id.toString(),
      settings,
    };
  };
}

export default new NotificationService()
