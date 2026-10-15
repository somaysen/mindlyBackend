import mongoose from "mongoose";

const channelPreferenceSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      unique: true,
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    taskReminders: {
      type: channelPreferenceSchema,
      default: () => ({}),
    },

    focusSessions: {
      type: channelPreferenceSchema,
      default: () => ({}),
    },

    weeklyReflections: {
      type: channelPreferenceSchema,
      default: () => ({}),
    },

    emailNotifications: {
      type: channelPreferenceSchema,
      default: () => ({}),
    },

    pushNotifications: {
      type: channelPreferenceSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// The unique user field already creates an index; avoid a duplicate index declaration.
const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
