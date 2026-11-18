import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import ideaController from "../controllers/idea.controller.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validateRequest(validation.ideaCreate), ideaController.createIdea);
router.get("/", validateRequest(validation.ideaList), ideaController.getIdeas);
router.get("/:ideaId", validateRequest(validation.ideaId), ideaController.getIdeaById);
router.patch("/:ideaId", validateRequest(validation.ideaId), validateRequest(validation.ideaUpdate), ideaController.updateIdea);
router.delete("/:ideaId", validateRequest(validation.ideaId), ideaController.deleteIdea);

export default router;
