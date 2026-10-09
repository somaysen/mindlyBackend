import UserModel from "../models/user.model.js";
import AppError from "../utils/errors.js";

class UserService {
  /**
   * Create or update a user profile.
   * Handles concurrent requests and duplicate-key errors.
   */
  async createUser(userData = {}) {
    const {
      auth,
      name,
      interests = [],
      planning = [],
      taskId,
      notificationId,
    } = userData;

    // Validate authentication ID
    if (!auth) {
      throw new AppError("Auth ID is required", 400);
    }

    // Validate name
    if (typeof name !== "string" || !name.trim()) {
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

    // Build the fields that should be updated
    const updateFields = {
      name: name.trim(),
      interests,
      planning,
    };

    // Do not erase existing references when IDs are omitted
    if (taskId !== undefined && taskId !== null) {
      updateFields.task = taskId;
    }

    if (notificationId !== undefined && notificationId !== null) {
      updateFields.notification = notificationId;
    }

    try {
      // Atomic upsert: update an existing profile or create one
      const user = await UserModel.findOneAndUpdate(
        { auth },
        {
          $set: updateFields,
          $setOnInsert: { auth },
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      if (!user) {
        throw new AppError("Unable to create or update user profile", 500);
      }

      return user;
    } catch (error) {
      // Recover when concurrent requests create the same auth profile
      if (error.code === 11000) {
        // The winning upsert may not be visible to the retry immediately.
        // Retry briefly so concurrent profile submissions stay idempotent.
        const retryDelays = [0, 10, 25];

        for (const delay of retryDelays) {
          if (delay) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          const existingUser = await UserModel.findOneAndUpdate(
            { auth },
            { $set: updateFields },
            {
              returnDocument: "after",
              upsert: false,
              runValidators: true,
            }
          );

          if (existingUser) {
            return existingUser;
          }
        }

        // A different unique field may have caused the conflict.
        throw new AppError(
          "A record with this value already exists",
          409
        );
      }

      // Preserve known application errors
      if (error instanceof AppError) {
        throw error;
      }

      // Let the centralized error handler handle unexpected errors
      throw error;
    }
  }

  /**
   * Get a user profile by profile ID.
   */
  async getUserById(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await UserModel.findById(userId).populate(
      "auth",
      "email isVerified"
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Get a user profile by authentication ID.
   */
  async getUserByAuthId(authId) {
    if (!authId) {
      throw new AppError("Auth ID is required", 400);
    }

    const user = await UserModel.findOne({
      auth: authId,
    }).populate("auth", "email isVerified");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Update user interests.
   */
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
        $set: { interests },
      },
      {
        returnDocument: "after",
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
