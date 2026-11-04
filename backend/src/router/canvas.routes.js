
import express from "express";
import canvasController from "../controllers/canvas.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", canvasController.create);
router.get("/", canvasController.list);
router.post("/:canvasId/sync-ticket", canvasController.createSyncTicket);
router.get("/:canvasId", canvasController.get);
router.patch("/:canvasId", canvasController.update);
router.delete("/:canvasId", canvasController.delete);

export default router;
