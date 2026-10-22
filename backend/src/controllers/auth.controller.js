import authService from "../services/auth.service.js";
import config from "../config/environment.js";

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: config.NODE_ENV === "production" ? "none" : "lax",
  maxAge: config.AUTH_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  path: "/",
};

const refreshTokenCookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: config.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
};

class AuthController {
  refreshToken = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const { accessToken } = await authService.refreshToken(refreshToken);
      res.cookie("accessToken", accessToken, accessTokenCookieOptions);

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req, res, next) => {
    try {
      const data = await authService.register(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { token, refreshToken, ...data } = await authService.login(
        req.body,
      );
      res.cookie("accessToken", token, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
      res.status(200).json({
        success: true,
        data: {
          ...data,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  googleLogin = async (req, res, next) => {
    try {
      const { token, refreshToken, ...data } = await authService.googleLogin(
        req.body?.credential,
      );
      res.cookie("accessToken", token, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
      return res.status(200).json({
        success: true,
        message: "Google login successful",
        data: { ...data, token },
      });
    } catch (error) {
      return next(error);
    }
  };

  verifyEmail = async (req, res, next) => {
    try {
      const { token, refreshToken, ...data } = await authService.verifyEmail(
        req.query?.token || req.body?.token,
      );
      res.cookie("accessToken", token, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: { ...data, token },
      });
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req, res, next) => {
    try {
      const result = await authService.resendVerification(req.body?.email);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const data = await authService.logout(req.accessToken);
      res.clearCookie("accessToken", accessTokenCookieOptions);
      res.clearCookie("refreshToken", refreshTokenCookieOptions);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
