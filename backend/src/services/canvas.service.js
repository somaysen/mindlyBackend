import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import AppError from "../utils/error.js";
import config from "../config/environment.js";
import Project from "../models/project.model.js";
import CanvasModel from "../models/CanvasModel.js";
import canvasSyncService from "./canvasSync.service.js";

const canvasProjection = "title projectId ownerId members createdAt updatedAt";

class CanvasService {
  getUserRole(canvas, userId) {
    if (canvas.ownerId.toString() === userId) return "owner";
    return (
      (canvas.members || []).find(
        (member) => member.userId?.toString() === userId,
      )?.role || null
    );
  }

  validateObjectId(value, name) {
    if (!mongoose.isObjectIdOrHexString(value)) {
      throw new AppError(`Invalid ${name}`, 400);
    }
  }

  validateTitle(title, { optional = false } = {}) {
    if (
      optional &&
      (title === undefined ||
        title === null ||
        (typeof title === "string" && !title.trim()))
    ) {
      return undefined;
    }
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 120
    ) {
      throw new AppError("Canvas title must be between 1 and 120 characters", 400);
    }
    return title.trim();
  }

  async requireCanvas(canvasId, { includeSnapshot = false } = {}) {
    this.validateObjectId(canvasId, "canvas ID");
    const projection = includeSnapshot
      ? `${canvasProjection} snapshot`
      : canvasProjection;
    const canvas = await CanvasModel.findById(canvasId).select(projection);
    if (!canvas) throw new AppError("Canvas not found", 404);
    return canvas;
  }

  async requireAccess(canvasId, userId) {
    const canvas = await this.requireCanvas(canvasId);
    const role = this.getUserRole(canvas, userId);
    if (!role) throw new AppError("You don't have access to this canvas", 403);
    return { canvas, role };
  }

  async create(userId, { projectId, title } = {}) {
    const hasProjectId =
      projectId !== undefined &&
      projectId !== null &&
      !(typeof projectId === "string" && projectId.trim() === "");
    if (hasProjectId) {
      this.validateObjectId(projectId, "project ID");
      const project = await Project.exists({ _id: projectId, user: userId });
      if (!project) throw new AppError("Project not found", 404);
    }

    const canvasTitle =
      title === undefined ? undefined : this.validateTitle(title);
    return CanvasModel.create({
      ownerId: userId,
      ...(hasProjectId ? { projectId } : {}),
      ...(canvasTitle === undefined ? {} : { title: canvasTitle }),
    });
  }

  async listForUser(userId, projectId) {
    const filter = {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    };
    if (projectId !== undefined) {
      this.validateObjectId(projectId, "project ID");
      filter.projectId = projectId;
    }

    return CanvasModel.find(filter)
      .select(canvasProjection)
      .sort({ updatedAt: -1 });
  }

  async getForUser(canvasId, userId) {
    const canvas = await this.requireCanvas(canvasId, { includeSnapshot: true });
    if (!this.getUserRole(canvas, userId)) {
      throw new AppError("You don't have access to this canvas", 403);
    }
    return canvas;
  }

  async rename(canvasId, userId, title) {
    const { canvas, role } = await this.requireAccess(canvasId, userId);
    if (role === "viewer") {
      throw new AppError("Viewers cannot edit this canvas", 403);
    }

    const normalizedTitle = this.validateTitle(title, { optional: true });
    if (normalizedTitle === undefined) return canvas;

    const updatedCanvas = await CanvasModel.findByIdAndUpdate(
      canvas._id,
      { $set: { title: normalizedTitle } },
      { returnDocument: "after", runValidators: true },
    ).select(canvasProjection);
    if (!updatedCanvas) throw new AppError("Canvas not found", 404);
    return updatedCanvas;
  }

  async delete(canvasId, userId) {
    const canvas = await this.requireCanvas(canvasId);
    if (canvas.ownerId.toString() !== userId) {
      throw new AppError("Only the canvas owner can delete it", 403);
    }

    const deletedCanvas = await CanvasModel.findByIdAndDelete(canvas._id)
      .select(canvasProjection);
    if (!deletedCanvas) throw new AppError("Canvas not found", 404);
    await canvasSyncService.closeCanvasRoom(canvas._id.toString());
    return deletedCanvas;
  }

  async createSyncTicket(canvasId, userId) {
    const { canvas, role } = await this.requireAccess(canvasId, userId);
    if (!config.SYNC_TICKET_SECRET) {
      throw new AppError("Canvas sync is not configured", 503);
    }

    return jwt.sign(
      {
        sub: userId,
        canvasId: canvas._id.toString(),
        role,
        purpose: "canvas-sync",
      },
      config.SYNC_TICKET_SECRET,
      {
        expiresIn: "60s",
        audience: "mindly-canvas",
        issuer: "mindly-api",
      },
    );
  }

  async deleteForProject(projectId) {
    const canvases = await CanvasModel.find({ projectId }).select("_id").lean();
    await CanvasModel.deleteMany({ projectId });
    await Promise.all(
      canvases.map((canvas) =>
        canvasSyncService.closeCanvasRoom(canvas._id.toString()),
      ),
    );
  }
}

export default new CanvasService();
