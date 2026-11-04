import AppError from "../utils/error.js";
import canvasService from "../services/canvas.service.js";

class CanvasController {
  getUserId(req) {
    const userId = req.auth?.id || req.auth?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    return userId.toString();
  }

  respond(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
  }

  create = async (req, res, next) => {
    try {
      const canvas = await canvasService.create(
        this.getUserId(req),
        req.body,
      );
      return this.respond(res, canvas, 201);
    } catch (error) {
      return next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const canvases = await canvasService.listForUser(
        this.getUserId(req),
        req.query.projectId,
      );
      return this.respond(res, canvases);
    } catch (error) {
      return next(error);
    }
  };

  get = async (req, res, next) => {
    try {
      const canvas = await canvasService.getForUser(
        req.params.canvasId,
        this.getUserId(req),
      );
      return this.respond(res, canvas);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const canvas = await canvasService.rename(
        req.params.canvasId,
        this.getUserId(req),
        req.body.title,
      );
      return this.respond(res, canvas);
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const canvas = await canvasService.delete(
        req.params.canvasId,
        this.getUserId(req),
      );
      return this.respond(res, canvas);
    } catch (error) {
      return next(error);
    }
  };

  createSyncTicket = async (req, res, next) => {
    try {
      const ticket = await canvasService.createSyncTicket(
        req.params.canvasId,
        this.getUserId(req),
      );
      return this.respond(res, { ticket });
    } catch (error) {
      return next(error);
    }
  };
}

export default new CanvasController();
