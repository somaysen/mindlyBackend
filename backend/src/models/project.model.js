
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },

    ProjectName: {
      type: String,
      required: true,
      trim: true,
    },

    desciption: {
      type: String,
      default: "",
      trim: true,
    },

    FileList: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    thoughtSpaces: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    tasklist: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
