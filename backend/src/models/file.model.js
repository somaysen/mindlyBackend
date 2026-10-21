import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "Untitled document",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },

    cloudinaryResourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
    },

    cloudinaryUrl: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      default: "application/octet-stream",
    },

    size: {
      type: Number,
      min: 0,
      default: 0,
    },

    format: {
      type: String,
      default: "txt",
    },
  },
  { timestamps: true },
);

fileSchema.index({ userId: 1, projectId: 1, updatedAt: -1 });

const FileModel =
  mongoose.models.ProjectFile ||
  mongoose.model("ProjectFile", fileSchema);

export default FileModel;
