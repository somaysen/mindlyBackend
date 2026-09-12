import UserModel from "../models/user.model.js";
import AppError from "../utils/errors.js";

class UserService {
  // Create or update user profile
  async createUser(userData = {}) {
    const {
      auth,
      name,
      interests = [],
      planning = [],
      taskId,
      notificationId,
    } = userData;

    console.log(userData);

    // Validate Auth ID
    if (!auth) {
      throw new AppError("Auth ID is required", 400);
    }

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Name is required", 400);
    }

    // Validate interests
    if (!Array.isArray(interests)) {
      throw new AppError("Interests must be an array", 400);
    }

    // Validate planning
    if (!Array.isArray(planning)) {
      throw new AppError("Planning must be an array", 400);
    }

    // Check if user profile already exists
    const existingUser = await UserModel.findOne({ auth });

    // If user already exists, update it instead of creating duplicate
    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.interests = interests;
      existingUser.planning = planning;

      // Only update these if values were provided
      if (taskId) {
        existingUser.task = taskId;
      }

      if (notificationId) {
        existingUser.notification = notificationId;
      }

      await existingUser.save();

      return existingUser;
    }

    // Create new user profile
    const user = await UserModel.create({
      auth,
      name: name.trim(),
      interests,
      planning,
      task: taskId || undefined,
      notification: notificationId || undefined,
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
      {
        $set: {
          interests,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}

export default new UserService();