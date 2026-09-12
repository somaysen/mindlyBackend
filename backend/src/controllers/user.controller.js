import userService from "../services/user.service.js";

class UserController {
  postUserInfo = async (req, res, next) => {
    try {
      const data = await userService.createUser({
        ...req.body,
        auth: req.user,
      });

      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();