import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Master notification switch
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // Task reminders
    taskReminders: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    // Focus session notifications
    focusSessions: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    // Weekly reflection reminders
    weeklyReflections: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    // Email notifications
    emailNotifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    // Push notifications
    pushNotifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
