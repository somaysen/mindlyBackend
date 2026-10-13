import AppError from "../utils/errors.js";
import UserModel from "../models/user.model.js";

const userMiddleware = async (req, res, next) => {
  try {
    // authMiddleware must run before userMiddleware
    if (!req.auth?.id) {
      return next(
        new AppError("Authentication required", 401)
      );
    }

    // Find user profile using authenticated user ID
    const user = await UserModel.findOne({
      auth: req.auth.id,
    }).populate("auth", "-password");

    if (!user) {
      return next(
        new AppError("User profile not found", 404)
      );
    }

    // Attach complete user profile to request
    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
};

export default userMiddleware;
