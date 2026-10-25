import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import ideaController from "../controllers/idea.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", ideaController.createIdea);
router.get("/", ideaController.getIdeas);
router.get("/:ideaId", ideaController.getIdeaById);
router.patch("/:ideaId", ideaController.updateIdea);
router.delete("/:ideaId", ideaController.deleteIdea);

export default router;
