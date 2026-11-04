
import mongoose from "mongoose";

const canvasSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Canvas",
      trim: true,
      maxlength: 120,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },

    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
        },
        role: {
          type: String,
          enum: ["owner", "editor", "viewer"],
          default: "editor",
        },
      },
    ],
  },
  { timestamps: true }
);

canvasSchema.index({ projectId: 1, ownerId: 1 });

const CanvasModel =
  mongoose.models.Canvas ||
  mongoose.model("Canvas", canvasSchema);

export default CanvasModel;
