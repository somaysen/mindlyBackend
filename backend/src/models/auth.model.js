import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."],
    },

    // Optional for OAuth-only accounts; required for password-based accounts.
    password: {
      type: String,
      select: false,
      minlength: 8,
      required: function () {
        return !this.googleId;
      },
    },

    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // Keep this field compatible with existing verification controllers.
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      },
    },
  },
);

authSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

authSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || typeof candidatePassword !== "string") return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const Auth = mongoose.models.Auth || mongoose.model("Auth", authSchema);
export default Auth;
