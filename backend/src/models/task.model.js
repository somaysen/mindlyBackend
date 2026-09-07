import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
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

    dueTime: {
      type: String,
      default: null,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    checklist: {
      type: [checklistItemSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;