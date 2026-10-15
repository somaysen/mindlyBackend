import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    // 24-hour HH:mm string, e.g. "09:30". Use null when no time is set.
    dueTime: {
      type: String,
      default: null,
      validate: {
        validator(value) {
          return value == null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        message: "dueTime must use 24-hour HH:mm format.",
      },
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      lowercase: true,
      trim: true,
    },

    checklist: {
      type: [checklistItemSchema],
      default: [],
      validate: {
        validator(items) {
          return items.length <= 100;
        },
        message: "A task can have at most 100 checklist items.",
      },
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
      lowercase: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

taskSchema.index({ user: 1, status: 1, dueDate: 1 });
taskSchema.index({ user: 1, updatedAt: -1 });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
export default Task;
