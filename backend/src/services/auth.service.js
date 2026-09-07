import nodemailer from "nodemailer";
import Auth from "../models/auth.model.js";
import { AppError } from "../utils/errors.js";
import config from "../config/env.js";

import {
  createVerificationToken,
  hashToken,
  createAccessToken,
} from "../utils/token.js";

class AuthService {
  async register(userData = {}) {
    const { name, email, password } = userData;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      throw new AppError("A user with this email already exists", 409);
    }

    const user = await Auth.create({
      name,
      email,
      password,
    });

    await this.sendVerificationEmail(user);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  }

  async resendVerification(email) {
    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await Auth.findOne({ email });

    if (!user || user.isVerified) {
      return;
    }

    await this.sendVerificationEmail(user);
  }

  async verifyEmail(token) {
    if (!token) {
      throw new AppError("Verification token is required", 400);
    }

    // Hash the token received from the URL
    const tokenHash = hashToken(token);

    const user = await Auth.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      throw new AppError("Verification link is invalid or has expired", 400);
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();
  }

  async sendVerificationEmail(user) {
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      throw new AppError("Email service is not configured", 500);
    }

    // Create verification token
    const { token, hashedToken, expiresAt } = createVerificationToken();

    // Save only the hashed token in database
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;

    await user.save();

    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_APP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: `Mindly <${config.GMAIL_USER}>`,
        to: user.email,
        subject: "Verify your Mindly email address",

        text: `
Verify your email address:

${verificationUrl}

This link expires in 15 minutes.
        `,

        html: `
          <p>Verify your email address by opening this link:</p>

          <p>
            <a href="${verificationUrl}">
              Verify email
            </a>
          </p>

          <p>This link expires in 15 minutes.</p>
        `,
      });
    } catch (error) {
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;

      await user.save();

      throw new AppError("Unable to send verification email", 502);
    }
  }

  async login(userData = {}) {
    const { email, password } = userData;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await Auth.findOne({ email });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    user.lastLoginAt = new Date();

    await user.save();

    // JWT creation is now handled by token.js
    const token = createAccessToken(user);

    return {
      token,

      user: {
        id: user._id,
        fullname: user.name,
        email: user.email,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    };
  }
}

export default new AuthService();
