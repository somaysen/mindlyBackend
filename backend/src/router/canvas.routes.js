
import express from "express";
import canvasController from "../controllers/canvas.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

// Canvas sync is a WebSocket endpoint authenticated with a short-lived ticket
// during the upgrade. If a proxy/client sends it as ordinary HTTP, report the
// protocol mismatch instead of treating it as a missing bearer token.
router.get("/:canvasId/sync", (_req, res) => {
  return res
    .set("Upgrade", "websocket")
    .status(426)
    .json({ success: false, message: "Canvas sync requires a WebSocket connection" });
});

router.use(authMiddleware);

router.post("/", validateRequest(validation.canvasCreate), canvasController.create);
router.get("/", validateRequest(validation.canvasList), canvasController.list);
router.post("/:canvasId/sync-ticket", validateRequest(validation.canvasId), canvasController.createSyncTicket);
router.get("/:canvasId/members", validateRequest(validation.canvasId), canvasController.listMembers);
router.post("/:canvasId/members", validateRequest(validation.canvasId), validateRequest(validation.canvasInvite), canvasController.inviteMember);
router.patch("/:canvasId/members/:memberId", validateRequest(validation.canvasMemberIds), validateRequest(validation.canvasRole), canvasController.updateMemberRole);
router.delete("/:canvasId/members/:memberId", validateRequest(validation.canvasMemberIds), canvasController.removeMember);
router.get("/:canvasId", validateRequest(validation.canvasId), canvasController.get);
router.patch("/:canvasId", validateRequest(validation.canvasId), validateRequest(validation.canvasUpdate), canvasController.update);
router.delete("/:canvasId", validateRequest(validation.canvasId), canvasController.delete);

export default router;
