import taskService from "../services/task.service.js";

class TaskController {
  creatingTask = async (req, res, next) => {
    try {
      const data = await taskService.creatingTask({
        ...req.body,
        auth: req.user,
      });

      res.status(201).json({
        success: true,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TaskController;