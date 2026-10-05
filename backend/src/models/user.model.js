import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
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
    },
    name: {
      type: String,
      trim: true,
      maxLength: 60,
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
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model("user", UserSchema);

export default UserModel;
