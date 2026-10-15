import mongoose from "mongoose";

const projectFileSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 255 },
    url: { type: String, trim: true, required: true },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

const thoughtSpaceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 150 },
    content: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const projectTaskSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 150 },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },

    // These names are normalized. Update controllers and frontend payloads accordingly.
    projectName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    fileList: {
      type: [projectFileSchema],
      default: [],
    },

    thoughtSpaces: {
      type: [thoughtSpaceSchema],
      default: [],
    },

    taskList: {
      type: [projectTaskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

projectSchema.index({ user: 1, updatedAt: -1 });
projectSchema.index(
  { user: 1, projectName: 1 },
  { unique: true },
);

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
