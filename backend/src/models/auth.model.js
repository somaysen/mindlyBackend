import mongoose from "mongoose";
import bcrypt from "bcrypt"

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxLength: 60,
    },
    email: {
      type: String,
      index: true,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

authSchema.pre("save", async function (next) {
    if(!this.isModified("password"))return next();

    this.password = await bcrypt.hash(this.password,10);
    next();
})

authSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password,this.password);
}

export default mongoose.model("Auth",authSchema);
