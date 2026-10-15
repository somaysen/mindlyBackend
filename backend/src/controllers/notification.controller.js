import NotificationService from "../services/notification.service.js";
import AppError from "../utils/error.js";

class NotificationController {
  updateNotificationSettings = async (req, res, next) => {
    try {
      const userId = req.auth?.id || req.auth?._id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const settings = await NotificationService.updateNotificationSettings(
        userId,
        req.body,
      );

      return res.status(200).json({
        success: true,
        message: "Notification settings updated successfully",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  getNotificationSettings = async (req, res, next) => {
    try {
      const userId = req.auth?.id || req.auth?._id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const settings = await NotificationService.getNotificationSettings(userId);
      return res.status(200).json({
        success: true,
        message: "Notification settings fetched successfully",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new NotificationController();
