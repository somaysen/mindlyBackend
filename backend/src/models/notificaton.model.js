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

    taskReminders: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    focusSessions: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    weeklyReflections: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;