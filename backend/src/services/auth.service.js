import Auth from "../models/auth.model.js";
import config from "../config/environment.js";
import AppError from "../utils/error.js";
import sendVerificationEmail from "../utils/emailVerification.js";
import logger from "../utils/logger.js";
import { OAuth2Client } from "google-auth-library";

import {
  blockAccessToken,
  createAccessToken,
  createRefreshToken,
  createVerificationToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/token.js";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : null;
const isValidEmail = (email) =>
  typeof email === "string" &&
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const passwordByteLength = (password) => Buffer.byteLength(password, "utf8");

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name || null,
  email: user.email,
});

const googleClient = new OAuth2Client();

class AuthService {
  // =========================
  // GOOGLE LOGIN
  // =========================

  async googleLogin(credential) {
    if (
      typeof credential !== "string" ||
      !credential.trim() ||
      credential.length > 10_000
    ) {
      throw new AppError("A valid Google credential is required", 400);
    }

    if (!config.GOOGLE_CLIENT_ID) {
      throw new AppError("Google sign-in is not configured", 503);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      const temporaryGoogleFailure =
        ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(
          error?.code,
        ) ||
        error?.response?.status === 429 ||
        error?.response?.status >= 500;

      if (temporaryGoogleFailure) {
        throw new AppError("Google sign-in is temporarily unavailable", 503);
      }
      throw new AppError("Google credential is invalid or expired", 401);
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new AppError("Google account could not be verified", 401);
    }

    const googleId = payload.sub;
    const email = normalizeEmail(payload.email);
    let user = await Auth.findOne({ googleId });

    if (!user) {
      const existingEmailUser = await Auth.findOne({ email });
      if (existingEmailUser) {
        throw new AppError(
          "An account with this email already exists. Sign in with your password first.",
          409,
        );
      }

      try {
        user = await Auth.create({
          name:
            typeof payload.name === "string"
              ? payload.name.slice(0, 120)
              : email.split("@")[0],
          email,
          googleId,
          isVerified: true,
          lastLoginAt: new Date(),
        });
      } catch (error) {
        // Another request may have created this Google account after the lookup.
        if (error?.code !== 11000) throw error;

        user = await Auth.findOne({ googleId });
        if (!user) {
          const emailUser = await Auth.findOne({ email });
          if (emailUser) {
            throw new AppError(
              "An account with this email already exists. Sign in with your password first.",
              409,
            );
          }
          throw error;
        }
      }
    }

    user.lastLoginAt = new Date();
    if (!user.name && typeof payload.name === "string") {
      user.name = payload.name.slice(0, 120);
    }
    await user.save();

    return {
      token: createAccessToken(user),
      refreshToken: createRefreshToken(user),
      user: {
        ...toSafeUser(user),
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    };
  }

  // =========================
  // REFRESH ACCESS TOKEN
  // =========================

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      if (!decoded?.id) {
        throw new AppError("Invalid refresh token", 401);
      }

      const user = await Auth.findById(decoded.id);

      if (!user) {
        throw new AppError(
          "User associated with refresh token not found",
          401,
        );
      }

      if (!user.isVerified) {
        throw new AppError("Please verify your email first", 403);
      }

      const accessToken = createAccessToken(user);

      return {
        accessToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Refresh token expired or invalid", 401);
    }
  }

  // =========================
  // REGISTER
  // =========================

  async register(userData = {}) {
    const email = normalizeEmail(userData.email);
    const { password } = userData;

    if (!isValidEmail(email) || typeof password !== "string") {
      throw new AppError("A valid email and password are required", 400);
    }

    if (password.length < 8 || passwordByteLength(password) > 72) {
      throw new AppError("Password must be at least 8 characters and no more than 72 bytes", 400);
    }

    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      // Existing but unverified user
      if (!existingUser.isVerified) {
        await this.sendVerificationEmail(existingUser);

        return {
          ...toSafeUser(existingUser),
          message: "Verification email has been resent",
        };
      }

      throw new AppError(
        "A user with this email already exists",
        409,
      );
    }

    const user = await Auth.create({
      email,
      password,
      isVerified: false,
    });

    await this.sendVerificationEmail(user);

    return {
      ...toSafeUser(user),
      message: "Registration successful. Please verify your email.",
    };
  }

  // =========================
  // VERIFY EMAIL
  // =========================

  async verifyEmail(token) {
    if (typeof token !== "string" || !token) {
      throw new AppError("Verification token is required", 400);
    }

    const hashedToken = hashToken(token);

    const user = await Auth.findOneAndUpdate(
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
          $gt: new Date(),
        },
        isVerified: false,
      },
      {
        $set: {
          isVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!user) {
      throw new AppError(
        "Verification link is invalid or has expired",
        400,
      );
    }

    logger.info(`Email verified successfully: ${user.email}`);

    return {
      token: createAccessToken(user),
      refreshToken: createRefreshToken(user),

      user: {
        ...toSafeUser(user),
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    };
  }

  // =========================
  // RESEND VERIFICATION
  // =========================

  async resendVerification(email) {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw new AppError("Email is required", 400);
    }

    const user = await Auth.findOne({ email: normalizedEmail });

    // Use one response for unknown, verified, and unverified addresses.
    if (user && !user.isVerified) {
      await this.sendVerificationEmail(user);
      logger.info(`Verification email resent successfully to ${user.email}`);
    }

    return {
      message:
        "If the account exists and is not verified, a verification email has been sent.",
    };
  }

  // =========================
  // SEND VERIFICATION EMAIL
  // =========================

  async sendVerificationEmail(user) {
    if (
      !config.GMAIL_USER ||
      !config.GMAIL_APP_PASSWORD
    ) {
      throw new AppError(
        "Email service is not configured",
        503,
      );
    }

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const {
      token,
      hashedToken,
      expiresAt,
    } = createVerificationToken();

    // Save previous token in case email fails
    const previousToken = user.emailVerificationToken;
    const previousExpires = user.emailVerificationExpires;

    // Save new verification token
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;

    await user.save();

    try {
      logger.info(
        `Sending verification email to ${user.email}`,
      );

      const result = await sendVerificationEmail(
        user,
        token,
      );

      logger.info(
        `Verification email delivered to ${user.email}`,
      );

      return result;
    } catch (error) {
      logger.error(
        `Verification email delivery failed for ${user.email}: ${
          error.code || "unknown"
        } - ${error.message}`,
      );

      // Restore previous token only if this request
      // still owns the current token
      try {
        await Auth.updateOne(
          {
            _id: user._id,
            emailVerificationToken: hashedToken,
          },
          {
            $set: {
              emailVerificationToken:
                previousToken || null,
              emailVerificationExpires:
                previousExpires || null,
            },
          },
        );
      } catch (rollbackError) {
        logger.error(
          `Unable to restore previous verification token: ${rollbackError.message}`,
        );
      }

      throw new AppError(
        "Unable to send verification email",
        502,
      );
    }
  }

  // =========================
  // LOGIN
  // =========================

  async login(userData = {}) {
    const email = normalizeEmail(userData.email);
    const { password } = userData;

    if (
      !email ||
      typeof password !== "string" ||
      !password ||
      passwordByteLength(password) > 72
    ) {
      throw new AppError(
        "Email and password are required",
        400,
      );
    }

    const user = await Auth.findOne({
      email,
    }).select("+password");

    if (
      !user ||
      !(await user.comparePassword(password))
    ) {
      throw new AppError(
        "Invalid email or password",
        401,
      );
    }

    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email first",
        403,
      );
    }

    const lastLoginAt = new Date();

    await Auth.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          lastLoginAt,
        },
      },
    );

    return {
      token: createAccessToken(user),
      refreshToken: createRefreshToken(user),

      user: {
        ...toSafeUser(user),
        isVerified: user.isVerified,
        lastLoginAt,
        createdAt: user.createdAt,
      },
    };
  }

  // =========================
  // LOGOUT
  // =========================

  async logout(token) {
    if (!token) {
      throw new AppError(
        "Access token is required",
        401,
      );
    }

    try {
      verifyAccessToken(token, {
        checkRevoked: false,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "Invalid or expired authentication token",
        401,
      );
    }

    await blockAccessToken(token);

    return {
      message: "Logged out successfully",
    };
  }
}

export default new AuthService();
