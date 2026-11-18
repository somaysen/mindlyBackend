import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import projectController from "../controllers/project.controller.js";
import userMiddleware from "../middlewares/user.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  validateRequest(validation.projectCreate),
  userMiddleware,
  projectController.createProject,
);
// Keep the original create path available for existing clients.
router.post(
  "/creating-project",
  validateRequest(validation.projectCreate),
  userMiddleware,
  projectController.createProject,
);
router.get("/get-project", userMiddleware, projectController.getProjects);
router.get(
  "/:projectId",
  validateRequest(validation.projectId),
  userMiddleware,
  projectController.getProjectById,
);
router.patch(
  "/:projectId",
  validateRequest(validation.projectId),
  validateRequest(validation.projectUpdate),
  userMiddleware,
  projectController.updateProject,
);
router.delete(
  "/:projectId",
  validateRequest(validation.projectId),
  userMiddleware,
  projectController.deleteProject,
);

export default router;
