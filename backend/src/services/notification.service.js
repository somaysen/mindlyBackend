import Notification from "../models/notification.model.js";
import UserNotification from "../models/userNotification.model.js";
import Task from "../models/task.model.js";
import config from "../config/environment.js";
import AppError from "../utils/error.js";

const TASK_REMINDER_LEAD_TIME_MS = 30 * 60 * 1000;

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

const isTaskCompleted = (task) =>
  task?.completed === true || task?.status?.toLowerCase() === "completed";

const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getTaskDueDateTime = (task) => {
  const dueDate = getValidDate(task?.dueDate);
  const dueTime = task?.dueTime;

  if (!dueDate || typeof dueTime !== "string") return null;

  const match = dueTime.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: config.SCHEDULE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(dueDate)
      .map(({ type, value }) => [type, value]),
  );

  const year = Number(dateParts.year);
  const month = Number(dateParts.month);
  const day = Number(dateParts.day);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const targetLocalAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let scheduledFor = targetLocalAsUtc;

  // Convert the task's configured local due time into UTC, accounting for DST.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const localParts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: config.SCHEDULE_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(scheduledFor))
        .map(({ type, value }) => [type, Number(value)]),
    );

    const representedLocalAsUtc = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute,
      localParts.second,
    );

    scheduledFor += targetLocalAsUtc - representedLocalAsUtc;
  }

  return new Date(scheduledFor);
};

class NotificationService {
  // ------------------------------------------
  // GET USER NOTIFICATION SETTINGS
  // ------------------------------------------

  getNotificationSettings = async (userId) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const settings = await Notification.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: { user: userId },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      notificationId: settings._id.toString(),
      settings,
    };
  };

  // ------------------------------------------
  // SCHEDULE TASK REMINDER
  // ------------------------------------------

  scheduleTaskReminder = async (task) => {
    if (!task?._id || !task?.user) {
      throw new AppError("Valid task and user are required", 400);
    }

    // Completed tasks should not have reminders.
    if (isTaskCompleted(task)) {
      await this.cancelTaskReminder(task.user, task._id);
      return null;
    }

    // Check notification settings.
    const settings = await Notification.findOne({
      user: task.user,
    }).select("notificationsEnabled taskReminders.enabled");

    const notificationsDisabled = settings?.notificationsEnabled === false;

    const taskRemindersDisabled = settings?.taskReminders?.enabled === false;

    if (notificationsDisabled || taskRemindersDisabled) {
      await this.cancelTaskReminder(task.user, task._id);
      return null;
    }

    // Schedule 30 minutes before the due time. If that time has passed,
    // make the reminder available immediately while the task is incomplete.
    const dueAt = getTaskDueDateTime(task);
    if (!dueAt) {
      await this.cancelTaskReminder(task.user, task._id);
      return null;
    }
    const reminderTime = new Date(dueAt.getTime() - TASK_REMINDER_LEAD_TIME_MS);
    const now = new Date();
    const scheduledFor = reminderTime > now ? reminderTime : now;

    // Create or update the existing reminder.
    const reminder = await UserNotification.findOneAndUpdate(
      {
        user: task.user,
        task: task._id,
        type: "task_reminder",
      },
      {
        $set: {
          title: "Task due soon",
          message: `"${task.taskName || "Your task"}" is due soon.`,
          scheduledFor,
          readAt: null,
        },
        $setOnInsert: {
          user: task.user,
          task: task._id,
          type: "task_reminder",
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return reminder;
  };

  markNotificationRead = async (userId, notificationId) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    if (!notificationId) {
      throw new AppError("Notification ID is required", 400);
    }

    const notification = await UserNotification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { readAt: new Date() } },
      { returnDocument: "after", runValidators: true },
    ).select("_id readAt");

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    return {
      notificationId: notification._id.toString(),
      readAt: notification.readAt,
    };
  };

  // ------------------------------------------
  // CANCEL TASK REMINDER
  // ------------------------------------------

  cancelTaskReminder = async (userId, taskId) => {
    if (!userId || !taskId) {
      return null;
    }

    return UserNotification.deleteOne({
      user: userId,
      task: taskId,
      type: "task_reminder",
    });
  };

  // ------------------------------------------
  // UPDATE NOTIFICATION SETTINGS
  // ------------------------------------------

  updateNotificationSettings = async (userId, data = {}) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Support nested API payloads.
    let payload = data;

    for (let depth = 0; depth < 2; depth += 1) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        break;
      }

      const wrappedPayload = payload.settings ?? payload.data;

      if (
        !wrappedPayload ||
        typeof wrappedPayload !== "object" ||
        Array.isArray(wrappedPayload)
      ) {
        break;
      }

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
      throw new AppError(
        "Provide at least one valid notification setting",
        400,
      );
    }

    const previousSettings = await Notification.findOne({ user: userId }).select(
      "notificationsEnabled taskReminders.enabled",
    );
    const remindersWereEnabled =
      previousSettings?.notificationsEnabled !== false &&
      previousSettings?.taskReminders?.enabled !== false;

    const settings = await Notification.findOneAndUpdate(
      { user: userId },
      {
        $set: allowedData,
        $setOnInsert: {
          user: userId,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    // Remove pending task reminders when disabled.
    if (
      settings.notificationsEnabled === false ||
      settings.taskReminders?.enabled === false
    ) {
      await UserNotification.deleteMany({
        user: userId,
        type: "task_reminder",
      });
    }

    const remindersAreEnabled =
      settings.notificationsEnabled !== false &&
      settings.taskReminders?.enabled !== false;

    if (!remindersWereEnabled && remindersAreEnabled) {
      const tasks = await Task.find({
        user: userId,
        completed: { $ne: true },
        status: { $ne: "completed" },
        dueDate: { $type: "date" },
        dueTime: { $type: "string" },
      })
        .select("_id user taskName dueDate dueTime status completed")
        .lean();

      for (const task of tasks) {
        await this.scheduleTaskReminder(task);
      }
    }

    return {
      notificationId: settings._id.toString(),
      settings,
    };
  };
}

export default new NotificationService();
