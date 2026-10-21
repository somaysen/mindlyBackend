import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import userMiddleware from "../middlewares/user.middleware.js";
import fileController from "../controllers/file.controller.js";

const router = express.Router();

router.get(
  "/project/:projectId/files",
  authMiddleware,
  userMiddleware,
  fileController.listProjectFiles,
);
router.post(
  "/project/:projectId/files",
  authMiddleware,
  userMiddleware,
  fileController.uploadProjectFile,
);
router.delete(
  "/project/:projectId/files/:fileId",
  authMiddleware,
  userMiddleware,
  fileController.deleteProjectFile,
);

export default router;
