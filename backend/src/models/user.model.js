import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    planning: [
      {
        type: String,
        trim: true,
      },
    ],
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
    },
  },
  {
    timestamps: "true",
  },
);

const UserModel = mongoose.model("user", UserSchema);

export default UserModel;
