import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      unique: true,
    },

    avatar: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },

    name: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    interests: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
      validate: {
        validator(items) {
          return items.length <= 30;
        },
        message: "A user can have at most 30 interests.",
      },
    },

    planning: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
      validate: {
        validator(items) {
          return items.length <= 30;
        },
        message: "A user can have at most 30 planning preferences.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserModel =
  mongoose.models.user || mongoose.model("user", userSchema);

export default UserModel;
