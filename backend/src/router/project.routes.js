import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import projectController from "../controllers/project.controller.js";
import userMiddleware from "../middlewares/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  userMiddleware,
  projectController.createProject,
);
// Keep the original create path available for existing clients.
router.post(
  "/creating-project",
  userMiddleware,
  projectController.createProject,
);
router.get("/get-project", userMiddleware, projectController.getProjects);
router.get(
  "/:projectId",
  userMiddleware,
  projectController.getProjectById,
);
router.patch(
  "/:projectId",
  userMiddleware,
  projectController.updateProject,
);
router.delete(
  "/:projectId",
  userMiddleware,
  projectController.deleteProject,
);

export default router;
