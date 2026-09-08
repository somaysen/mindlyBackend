import UserModel from "../models/user.model.js";
import AppError from "../utils/errors.js";

class UserService {
  // Create user profile
  async createUser(userData = {}) {
    const {
      auth,
      name,
      interests = [],
      planning = [],
    } = userData;

    if (!auth) {
      throw new AppError("Auth ID is required", 400);
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Name is required", 400);
    }

    if (!Array.isArray(interests)) {
      throw new AppError("Interests must be an array", 400);
    }

    if (!Array.isArray(planning)) {
      throw new AppError("Planning must be an array", 400);
    }

    // Check if profile already exists
    const existingUser = await UserModel.findOne({ auth });

    if (existingUser) {
      throw new AppError("User profile already exists", 409);
    }
    console.log(req.user.id)

    const user = await UserModel.create({
      auth,
      name: name.trim(),
      interests,
      planning,
    });

    return user;
  }

  // Get user by ID
  async getUserById(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await UserModel.findById(userId)
      .populate("auth")
      .populate("task")
      .populate("notification");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // Get user by Auth ID
  async getUserByAuthId(authId) {
    if (!authId) {
      throw new AppError("Auth ID is required", 400);
    }

    const user = await UserModel.findOne({ auth: authId })
      .populate("auth")
      .populate("task")
      .populate("notification");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  

  // Update interests
  async updateInterests(userId, interests = []) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!Array.isArray(interests)) {
      throw new AppError("Interests must be an array", 400);
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { interests } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }


}

export default new UserService();
