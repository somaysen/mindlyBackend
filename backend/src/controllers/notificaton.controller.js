import notificationService from "../services/notification.service.js";

class NotificationController {
  permissionNotification = async (req, res, next) => {
    try {
      const data =
        await notificationService.getNotificationSettings({
          ...req.body,
          auth: req.user.sub,
        });

      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  updateNotificationSettings = async (req, res, next) => {
    try {
      const data =
        await notificationService.updateNotificationSettings(
          req.user._id,
          req.body
        );

      return res.status(200).json({
        success: true,
        message: "Notification settings updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new NotificationController();