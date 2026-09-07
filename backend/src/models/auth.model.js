import mongoose from "mongoose";
import bcrypt from "bcrypt";

const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
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
    emailVerificationToken: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
authSchema.pre("save", async function () {
  // Don't hash if password wasn't changed
  if (!this.isModified("password")) {
    return;
  }

  // Don't try to hash an empty password
  if (!this.password) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
authSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const Auth = mongoose.model("Auth", authSchema);

export default Auth;
