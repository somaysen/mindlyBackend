
import Notification from "../models/notification.model.js";
import AppError from "../utils/error.js";

const notificationChannels = [
  "taskReminders",
  "focusSessions",
  "weeklyReflections",
  "emailNotifications",
  "pushNotifications",
];

const getEnabledValue = (value) => {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return typeof value.enabled === "boolean" ? value.enabled : undefined;
  }
  return undefined;
};

class NotificationService {
  // Get notification settings
  getNotificationSettings = async (userId) => {
    const settings = await Notification.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );

    return {
      notificationId: settings._id,
      settings,
    };
  };

  // Create / update notification settings
  updateNotificationSettings = async (userId, data = {}) => {
    // Accept both the API's flat boolean fields and the nested channel objects
    // returned by GET /settings (for example, { taskReminders: { enabled: false } }).
    let payload = data;
    for (let depth = 0; depth < 2; depth += 1) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) break;
      const wrappedPayload = payload.settings ?? payload.data;
      if (!wrappedPayload || typeof wrappedPayload !== "object" || Array.isArray(wrappedPayload)) break;
      payload = wrappedPayload;
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new AppError("Notification settings must be a JSON object", 400);
    }

    const allowedData = {};

    if (typeof payload.notificationsEnabled === "boolean") {
      allowedData.notificationsEnabled = payload.notificationsEnabled;
    }

    for (const channel of notificationChannels) {
      const enabled = getEnabledValue(payload[channel]);
      if (typeof enabled === "boolean") {
        allowedData[`${channel}.enabled`] = enabled;
      }
    }

    if (Object.keys(allowedData).length === 0) {
      throw new AppError("Provide at least one valid notification setting", 400);
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
        returnDocument: "after",
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
