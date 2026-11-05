
import express from "express";
import canvasController from "../controllers/canvas.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

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

router.post("/", canvasController.create);
router.get("/", canvasController.list);
router.post("/:canvasId/sync-ticket", canvasController.createSyncTicket);
router.get("/:canvasId/members", canvasController.listMembers);
router.post("/:canvasId/members", canvasController.inviteMember);
router.patch("/:canvasId/members/:memberId", canvasController.updateMemberRole);
router.delete("/:canvasId/members/:memberId", canvasController.removeMember);
router.get("/:canvasId", canvasController.get);
router.patch("/:canvasId", canvasController.update);
router.delete("/:canvasId", canvasController.delete);

export default router;
