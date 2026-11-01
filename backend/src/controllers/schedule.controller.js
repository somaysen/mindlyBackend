
import scheduleService from "../services/schedule.service.js";
import AppError from "../utils/error.js";

class ScheduleController {
  async getTodaySchedule(req, res, next) {
    try {
      // authMiddleware populates req.auth, not req.user.
      const userId = req.auth?.id || req.auth?._id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const date = req.query.date;

      const schedule = await scheduleService.getDailySchedule(
        userId,
        date
      );

      return res.status(200).json({
        success: true,
        message: "Schedule fetched successfully",
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ScheduleController();
