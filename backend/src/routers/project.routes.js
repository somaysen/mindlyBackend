import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import projectController from "../controllers/project.controller.js";
import userMiddleware from "../middlewares/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  authMiddleware,
  userMiddleware,
  projectController.createProject,
);
// Keep the original create path available for existing clients.
router.post(
  "/creating-project",
  authMiddleware,
  userMiddleware,
  projectController.createProject,
);
router.get("/get-project", authMiddleware, userMiddleware, projectController.getProjects);
router.get(
  "/:projectId",
  authMiddleware,
  userMiddleware,
  projectController.getProjectById,
);
router.patch(
  "/:projectId",
  authMiddleware,
  userMiddleware,
  projectController.updateProject,
);
router.delete(
  "/:projectId",
  authMiddleware,
  userMiddleware,
  projectController.deleteProject,
);

export default router;
