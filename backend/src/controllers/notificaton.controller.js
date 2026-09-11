import notificationService from "../services/notification.service.js";

class NotificationController {
  permissionNotification = async (req, res, next) => {
    try {
      // Get user ID from auth middleware
      const userId = req.user._id;

      // Notification settings from request body
      const data = req.body;

      const settings = await notificationService.updateNotificationSettings(
        userId,
        data,
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

  updateNotificationSettings = async (req, res, next) => {
    try {
      const userId = req.user._id;

      const settings =
        await notificationService.getNotificationSettings(userId);

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
