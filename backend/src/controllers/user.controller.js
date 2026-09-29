import userService from "../services/user.service.js";
import AppError from "../utils/errors.js";

class UserController {
  // Create user profile
  postUserInfo = async (req, res, next) => {
    try {
      console.log("POST /info-user");
      console.log("req.user:", req.user);

      const authId = req.user?.id;

      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      console.log("Auth ID:", authId);

      const data = await userService.createUser({
        ...req.body,
        auth: authId,
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
      console.log("GET /get-info");
      console.log("req.user:", req.user);

      const authId = req.user?.id;

      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      console.log("Auth ID:", authId);

      const user = await userService.getUserByAuthId(authId);

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