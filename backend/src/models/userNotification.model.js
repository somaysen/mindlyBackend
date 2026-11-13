import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["task_reminder"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userNotificationSchema.index({ user: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, task: 1, type: 1 }, { unique: true });

const UserNotification =
  mongoose.models.UserNotification ||
  mongoose.model("UserNotification", userNotificationSchema);

export default UserNotification;
