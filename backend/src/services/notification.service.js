import Notification from "../models/notificaton.model.js";

class NotificationService {
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

  updateNotificationSettings = async (userId, data) => {
    const allowedData = {};

    if (typeof data.notificationsEnabled === "boolean") {
      allowedData.notificationsEnabled = data.notificationsEnabled;
    }

    if (typeof data.taskReminders?.enabled === "boolean") {
      allowedData["taskReminders.enabled"] = data.taskReminders.enabled;
    }

    if (typeof data.focusSessions?.enabled === "boolean") {
      allowedData["focusSessions.enabled"] = data.focusSessions.enabled;
    }

    const settings = await Notification.findOneAndUpdate(
      {
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
      },
    );

    return settings;
  };
}

export default new NotificationService();
