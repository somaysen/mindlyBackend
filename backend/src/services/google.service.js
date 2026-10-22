import { OAuth2Client } from "google-auth-library";
import Auth from "../models/auth.model.js";
import config from "../config/environment.js";
import AppError from "../utils/error.js";
import { createAccessToken, createRefreshToken } from "../utils/token.js";

const googleClient = new OAuth2Client();
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : null;

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name || null,
  email: user.email,
});

const linkGoogleAccount = (userId, googleId) =>
  Auth.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { googleId: { $exists: false } },
        { googleId: null },
        { googleId },
      ],
    },
    {
      $set: {
        googleId,
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    },
    { returnDocument: "after" },
  );

class GoogleService {
  async login(credential) {
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
        // Google verifies ownership of the matching email. Keep the existing password.
        user = await linkGoogleAccount(existingEmailUser._id, googleId);
        if (!user) {
          throw new AppError(
            "This email is linked to a different Google account.",
            409,
          );
        }
      } else {
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
          // Another request may have created or linked this account after the lookup.
          if (error?.code !== 11000) throw error;

          user = await Auth.findOne({ googleId });
          if (!user) {
            const emailUser = await Auth.findOne({ email });
            if (!emailUser) throw error;

            user = await linkGoogleAccount(emailUser._id, googleId);
            if (!user) {
              throw new AppError(
                "This email is linked to a different Google account.",
                409,
              );
            }
          }
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
}

export default new GoogleService();
