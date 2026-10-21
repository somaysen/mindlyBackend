import AppError from "../utils/error.js";
import fileService from "../services/file.service.js";

class FileController {
  listProjectFiles = async (req, res, next) => {
    try {
      const userId = req.auth?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await fileService.listProjectFiles(
        userId,
        req.params.projectId,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  };

  uploadProjectFile = async (req, res, next) => {
    try {
      const userId = req.auth?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await fileService.uploadProjectFile(
        userId,
        req.params.projectId,
        req.body,
      );
      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  };

  deleteProjectFile = async (req, res, next) => {
    try {
      const userId = req.auth?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await fileService.deleteProjectFile(
        userId,
        req.params.projectId,
        req.params.fileId,
      );
      return res.status(200).json({
        success: true,
        message: "File deleted successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default new FileController();
