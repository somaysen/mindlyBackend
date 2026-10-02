import Auth from "../models/auth.model.js";
import config from "../config/env.js";
import AppError from "../utils/errors.js";
import sendVerificationEmail from "../utils/emailVerification.js";

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

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

class AuthService {
  // REFRESH ACCESS TOKEN

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      if (!decoded?.id) {
        throw new AppError("Invalid refresh token", 401);
      }

      // Check user still exists
      const user = await Auth.findById(decoded.id);

      if (!user) {
        throw new AppError("User associated with refresh token not found", 401);
      }

      // User must be verified
      if (!user.isVerified) {
        throw new AppError("Please verify your email first", 403);
      }

      // Generate new access token
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

  // REGISTER

  async register(userData = {}) {
    const { password } = userData;
    const email = normalizeEmail(userData.email);

    if (
      typeof email !== "string" ||
      !email ||
      typeof password !== "string" ||
      !password
    ) {
      throw new AppError("Email and password are required", 400);
    }

    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        await this.sendVerificationEmail(existingUser);

        return {
          ...toSafeUser(existingUser),
          message: "Verification email has been resent",
        };
      }

      throw new AppError("A user with this email already exists", 409);
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

  // VERIFY EMAIL

  async verifyEmail(token) {
    if (typeof token !== "string" || !token) {
      throw new AppError("Verification token is required", 400);
    }

    const user = await Auth.findOneAndUpdate({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: {
        $gt: new Date(),
      },
      isVerified: false,
    }, {
      $set: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    }, { new: true });

    if (!user) {
      throw new AppError("Verification link is invalid or has expired", 400);
    }

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

  // RESEND VERIFICATION

  async resendVerification(user) {
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      throw new AppError("Email service is not configured", 500);
    }

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isVerified === true) {
      return null;
    }

    return await this.sendVerificationEmail(user);
  }

  // SEND VERIFICATION EMAIL

  async sendVerificationEmail(user) {
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      throw new AppError("Email service is not configured", 500);
    }

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { token, hashedToken, expiresAt } = createVerificationToken();
    const previousToken = user.emailVerificationToken;
    const previousExpires = user.emailVerificationExpires;

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;

    await user.save();

    try {
      const result = await sendVerificationEmail(user, token);

      console.log("Verification email sent successfully");

      console.log("Message ID:", result?.messageId);

      return result;
    } catch (error) {
      console.error("========== EMAIL ERROR ==========");

      console.error("Message:", error.message);

      console.error("Code:", error.code);

      console.error("Command:", error.command);

      console.error("Response:", error.response);

      console.error("Response Code:", error.responseCode);

      console.error("================================");

      // Restore the prior link only if this request still owns the stored token.
      // A concurrent resend may already have installed a newer token.
      try {
        await Auth.updateOne(
          { _id: user._id, emailVerificationToken: hashedToken },
          {
            $set: {
              emailVerificationToken: previousToken || null,
              emailVerificationExpires: previousExpires || null,
            },
          },
        );
      } catch (rollbackError) {
        console.error("Unable to restore previous verification token:", rollbackError);
      }

      throw new AppError("Unable to send verification email", 502);
    }
  }

  // LOGIN

  async login(userData = {}) {
    const email = normalizeEmail(userData.email);

    const { password } = userData;

    if (!email || typeof password !== "string" || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await Auth.findOne({
      email,
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    const lastLoginAt = new Date();

    await Auth.updateOne(
      { _id: user._id },
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

  // LOGOUT

  async logout(token) {
    if (!token) {
      throw new AppError("Access token is required", 401);
    }

    try {
      verifyAccessToken(token, {
        checkRevoked: false,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Invalid or expired authentication token", 401);
    }

    await blockAccessToken(token);

    return {
      message: "Logged out successfully",
    };
  }
}

export default new AuthService();
