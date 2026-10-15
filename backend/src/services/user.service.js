import mongoose from "mongoose";
import UserModel from "../models/user.model.js";
import AppError from "../utils/error.js";

const normalizeStringList = (value, fieldName) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AppError(`${fieldName} must be an array of strings`, 400);
  }

  return value.map((item) => item.trim()).filter(Boolean);
};

class UserService {
  async createUser(userData = {}) {
    const { auth, name, avatar, interests, planning } = userData;

    if (!mongoose.isValidObjectId(auth)) {
      throw new AppError("A valid Auth ID is required", 400);
    }

    if (typeof name !== "string" || !name.trim()) {
      throw new AppError("Name is required", 400);
    }

    const normalizedName = name.trim();
    if (normalizedName.length > 60) {
      throw new AppError("Name must be 60 characters or fewer", 400);
    }

    const updateFields = { name: normalizedName };

    if (avatar !== undefined) {
      if (typeof avatar !== "string") {
        throw new AppError("Avatar must be a string", 400);
      }
      updateFields.avatar = avatar.trim();
    }

    if (interests !== undefined) {
      updateFields.interests = normalizeStringList(interests, "Interests");
    }

    if (planning !== undefined) {
      updateFields.planning = normalizeStringList(planning, "Planning");
    }

    try {
      return await UserModel.findOneAndUpdate(
        { auth },
        { $set: updateFields },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    } catch (error) {
      // Concurrent first requests can race on the unique auth index.
      if (error?.code === 11000 && error.keyPattern?.auth) {
        const existingUser = await UserModel.findOneAndUpdate(
          { auth },
          { $set: updateFields },
          { returnDocument: "after", runValidators: true },
        );

        if (existingUser) return existingUser;
      }

      throw error;
    }
  }

  async getUserById(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await UserModel.findById(userId).populate(
      "auth",
      "email isVerified",
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async getUserByAuthId(authId) {
    if (!authId) {
      throw new AppError("Auth ID is required", 400);
    }

    const user = await UserModel.findOne({ auth: authId }).populate(
      "auth",
      "email isVerified",
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async updateInterests(userId, interests = []) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const normalizedInterests = normalizeStringList(interests, "Interests");
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { interests: normalizedInterests } },
      { returnDocument: "after", runValidators: true },
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}

export default new UserService();
