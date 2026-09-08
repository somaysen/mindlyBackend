import Auth from "../models/auth.model.js";
import config from "../config/env.js";
import AppError from "../utils/errors.js";
import sendVerificationEmail from "../utils/emailVerification.js";
import {
  blockAccessToken,
  createAccessToken,
  createVerificationToken,
  hashToken,
  verifyAccessToken,
} from "../utils/token.js";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : null;

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

class AuthService {
  async register(userData = {}) {
    const { password } = userData;
    const email = normalizeEmail(userData.email);

    if (typeof !email == "string" || typeof password !== "string" || !password) {
      throw new AppError("email, and password are required", 400);
    }

    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      throw new AppError("A user with this email already exists", 409);
    }

    const user = await Auth.create({
      email,
      password,
    });

    await this.sendVerificationEmail(user);
    return toSafeUser(user);
  }

  async verifyEmail(token) {
    if (typeof token !== "string" || !token) {
      throw new AppError("Verification token is required", 400);
    }

    const user = await Auth.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError("Verification link is invalid or has expired", 400);
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return toSafeUser(user);
  }

  async resendVerification(emailInput) {
    const email = normalizeEmail(emailInput);

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await Auth.findOne({ email });

    // A single generic response prevents email-account enumeration.
    if (!user || user.isVerified) {
      return;
    }

    await this.sendVerificationEmail(user);
  }

  async sendVerificationEmail(user) {
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      throw new AppError("Email service is not configured", 500);
    }

    const { token, hashedToken, expiresAt } = createVerificationToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    try {
      await sendVerificationEmail(user, token);
    } catch {
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
      throw new AppError("Unable to send verification email", 502);
    }
  }

  async login(userData = {}) {
    const email = normalizeEmail(userData.email);
    const { password } = userData;

    if (!email || typeof password !== "string" || !password) {
      throw new AppError("Email and password are required", 400);
    }

    // Get user with password
    const user = await Auth.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check email verification
    if (!user.isVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    // Update only lastLoginAt
    const lastLoginAt = new Date();

    await Auth.updateOne({ _id: user._id }, { $set: { lastLoginAt } });

    return {
      token: createAccessToken(user),

      user: {
        ...toSafeUser(user),
        isVerified: user.isVerified,
        lastLoginAt,
        createdAt: user.createdAt,
      },
    };
  }

  async logout(token) {
    if (!token) {
      throw new AppError("Access token is required", 401);
    }

    try {
      verifyAccessToken(token);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Invalid or expired authentication token", 401);
    }

    await blockAccessToken(token);
    return { message: "Logged out successfully" };
  }
}

export default new AuthService();
