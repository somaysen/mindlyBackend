import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import userMiddleware from "../middlewares/user.middleware.js";
import fileController from "../controllers/file.controller.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.get(
  "/:projectId/files",
  authMiddleware,
  validateRequest(validation.fileProjectId),
  userMiddleware,
  fileController.listProjectFiles,
);
router.post(
  "/:projectId/files",
  authMiddleware,
  validateRequest(validation.fileProjectId),
  validateRequest(validation.fileUpload),
  userMiddleware,
  fileController.uploadProjectFile,
);
router.delete(
  "/:projectId/files/:fileId",
  authMiddleware,
  validateRequest(validation.fileIds),
  userMiddleware,
  fileController.deleteProjectFile,
);

export default router;
