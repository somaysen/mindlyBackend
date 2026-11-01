
import TaskModel from "../models/task.model.js";
import AppError from "../utils/error.js";
import config from "../config/environment.js";

const TIME_ZONE = config.SCHEDULE_TIME_ZONE;

// Format date as YYYY-MM-DD in the selected timezone
const getDateKey = (date, timeZone = TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Convert a local date/time in a timezone to UTC
const zonedDateToUTC = (dateString, timeZone = TIME_ZONE) => {
  const [year, month, day] = dateString.split("-").map(Number);

  const target = Date.UTC(year, month - 1, day);
  let result = target;

  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(result));

    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, Number(value)])
    );

    const represented = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );

    result += target - represented;
  }

  return new Date(result);
};

const getDayRange = (dateString, timeZone) => {
  const start = zonedDateToUTC(dateString, timeZone);

  const [year, month, day] = dateString.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDateString = [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");

  const end = zonedDateToUTC(nextDateString, timeZone);

  return { start, end };
};

const getPriorityOrder = (priority) => {
  const order = {
    high: 1,
    medium: 2,
    low: 3,
  };

  return order[priority] ?? 4;
};

class ScheduleService {
  async getDailySchedule(userId, requestedDate) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (requestedDate !== undefined && typeof requestedDate !== "string") {
      throw new AppError("Date must use YYYY-MM-DD format", 400);
    }

    const date = requestedDate || getDateKey(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD", 400);
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new AppError("Invalid calendar date", 400);
    }

    const { start, end } = getDayRange(date, TIME_ZONE);

    // The schedule is based on when tasks were created, in the schedule timezone.
    const tasks = await TaskModel.find({
      user: userId,
      createdAt: {
        $gte: start,
        $lt: end,
      },
    }).sort({
      dueTime: 1,
      createdAt: 1,
    }).lean();

    const now = new Date();
    const currentDate = getDateKey(now);
    const currentTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);

    const completed = [];
    const upcoming = [];
    const overdue = [];

    const normalizedTasks = tasks.map((task) => {
      const isCompleted = task.completed === true || task.status === "completed";

      let scheduleStatus = "upcoming";

      if (isCompleted) {
        scheduleStatus = "completed";
      } else if (
        date < currentDate ||
        (date === currentDate &&
          task.dueTime &&
          task.dueTime < currentTime)
      ) {
        scheduleStatus = "overdue";
      }

      const formattedTask = {
        ...task,
        scheduleStatus,
      };

      if (scheduleStatus === "completed") {
        completed.push(formattedTask);
      } else if (scheduleStatus === "overdue") {
        overdue.push(formattedTask);
      } else {
        upcoming.push(formattedTask);
      }

      return formattedTask;
    });

    // Tasks with the same time are ordered by priority
    const sortTasks = (a, b) => {
      const timeA = a.dueTime || "99:99";
      const timeB = b.dueTime || "99:99";

      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }

      return getPriorityOrder(a.priority) -
        getPriorityOrder(b.priority);
    };

    completed.sort(sortTasks);
    upcoming.sort(sortTasks);
    overdue.sort(sortTasks);

    const totalTasks = tasks.length;
    const completedCount = completed.length;
    const upcomingCount = upcoming.length;
    const overdueCount = overdue.length;

    const completionPercentage = totalTasks
      ? Math.round((completedCount / totalTasks) * 100)
      : 0;

    return {
      date,
      timeZone: TIME_ZONE,

      summary: {
        totalTasks,
        completed: completedCount,
        upcoming: upcomingCount,
        overdue: overdueCount,
        completionPercentage,
      },

      tasks: normalizedTasks.sort(sortTasks),

      sections: {
        completed,
        upcoming,
        overdue,
      },
    };
  }
}

export default new ScheduleService();
