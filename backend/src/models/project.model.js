import mongoose from "mongoose";

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

    fileList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectFile",
      required: true,
      index: true,
    }],

    thoughtSpaces: {
      type: [],
      default: [],
    },

    taskList: {
      type: [],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

projectSchema.index({ user: 1, updatedAt: -1 });
projectSchema.index({ user: 1, projectName: 1 }, { unique: true });

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
