import authService from "../services/auth.service.js";
import config from "../config/env.js";

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: config.NODE_ENV === "production" ? "none" : "lax",
  maxAge: config.AUTH_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  path: "/",
};

class AuthController {
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
      const { token, ...data } = await authService.login(req.body);
      res.cookie("accessToken", token, accessTokenCookieOptions);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req, res, next) => {
    try {
      const data = await authService.verifyEmail(
        req.query.token || req.body.token,
      );

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req, res, next) => {
    try {
      await authService.resendVerification(req.body.email);
      res.status(200).json({
        success: true,
        message: "If the account exists, a verification email has been sent",
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const data = await authService.logout(req.accessToken);
      res.clearCookie("accessToken", accessTokenCookieOptions);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
