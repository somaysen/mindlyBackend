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

  getAllTasks = async (req, res, next) => {
    try {
      const data = await taskService.getAllTasks({
        user: req.user,
      });

      res.status(200).json({
        success: true,
        data: data,
      });
      
    } catch (error) {
      next(error);
    }
  };

  getTaskByUserId = async (req, res, next) => {
    try {
      const data = await taskService.getUserById({
        user: req.user,
      });

      res.status(200).json({
        success:true,
        data:data,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default TaskController;