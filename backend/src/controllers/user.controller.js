import userService from "../services/user.service.js";
import AppError from "../utils/errors.js";

class UserController {
  // Create user profile
  postUserInfo = async (req, res, next) => {
    try {
      const data = await userService.createUser({
        ...req.body,
        auth: req.user?.id || req.user?._id,
      });

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get current user
  getUserById = async (req, res, next) => {
    try {
      const userId = req.user;

      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await userService.getUserByAuthId(userId);

      return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();

