import Notification from "../models/notificaton.model.js";

class NotificationService {
  // Get notification settings
  getNotificationSettings = async (userId) => {
    let settings = await Notification.findOne({
      user: userId,
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await Notification.create({
        user: userId,
      });
    }

    return settings;
  };

  // Create / update notification settings
  updateNotificationSettings = async (userId, data) => {
    const allowedData = {};

    if (typeof data.notificationsEnabled === "boolean") {
      allowedData.notificationsEnabled = data.notificationsEnabled;
    }

    if (typeof data.taskReminders === "boolean") {
      allowedData["taskReminders.enabled"] = data.taskReminders;
    }

    if (typeof data.focusSessions === "boolean") {
      allowedData["focusSessions.enabled"] = data.focusSessions;
    }

    const settings = await Notification.findOneAndUpdate(
      {
        _id,
        user: userId,
      },
      {
        $set: allowedData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return settings;
  };
}

export default new NotificationService();