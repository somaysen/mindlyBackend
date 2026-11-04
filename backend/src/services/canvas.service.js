import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import AppError from "../utils/error.js";
import config from "../config/environment.js";
import Project from "../models/project.model.js";
import Auth from "../models/auth.model.js";
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

  async requireCanvas(canvasId) {
    this.validateObjectId(canvasId, "canvas ID");
    const canvas = await CanvasModel.findById(canvasId).select(canvasProjection);
    if (!canvas) throw new AppError("Canvas not found", 404);
    return canvas;
  }

  async requireAccess(canvasId, userId) {
    const canvas = await this.requireCanvas(canvasId);
    const role = this.getUserRole(canvas, userId);
    if (!role) throw new AppError("You don't have access to this canvas", 403);
    return { canvas, role };
  }

  async requireOwner(canvasId, userId) {
    const canvas = await this.requireCanvas(canvasId);
    if (canvas.ownerId.toString() !== userId) {
      throw new AppError("Only the canvas owner can manage members", 403);
    }
    return canvas;
  }

  validateMemberRole(role) {
    if (role !== "editor" && role !== "viewer") {
      throw new AppError("Canvas member role must be editor or viewer", 400);
    }
    return role;
  }

  async getMemberDetails(userIds) {
    const accounts = await Auth.find({ _id: { $in: userIds } })
      .select("email")
      .lean();
    return new Map(
      accounts.map((account) => [account._id.toString(), account.email]),
    );
  }

  async listMembers(canvasId, ownerId) {
    const canvas = await this.requireOwner(canvasId, ownerId);
    const memberIds = [
      canvas.ownerId.toString(),
      ...(canvas.members || [])
        .map((member) => member.userId?.toString())
        .filter((memberId) => memberId && memberId !== ownerId),
    ];
    const emails = await this.getMemberDetails(memberIds);
    return [
      { userId: ownerId, email: emails.get(ownerId) || "", role: "owner" },
      ...(canvas.members || [])
        .filter((member) => member.userId && member.userId.toString() !== ownerId)
        .map((member) => {
          const userId = member.userId.toString();
          return {
            userId,
            email: emails.get(userId) || "",
            role: member.role,
          };
        }),
    ];
  }

  async inviteMember(canvasId, ownerId, { email, role = "editor" } = {}) {
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AppError("A valid member email is required", 400);
    }
    const memberRole = this.validateMemberRole(role);
    const canvas = await this.requireOwner(canvasId, ownerId);
    const account = await Auth.findOne({ email: normalizedEmail }).select("_id email");
    if (!account) throw new AppError("Registered user not found", 404);
    const memberId = account._id.toString();
    if (memberId === ownerId) {
      throw new AppError("The canvas owner is already a member", 400);
    }

    const existingMember = canvas.members.find(
      (member) => member.userId?.toString() === memberId,
    );
    if (existingMember) {
      existingMember.role = memberRole;
    } else {
      canvas.members.push({ userId: account._id, role: memberRole });
    }
    await canvas.save();
    canvasSyncService.closeCanvasUserSessions(
      canvasId,
      memberId,
      "Canvas access changed. Reconnect to continue.",
    );
    return { userId: memberId, email: account.email, role: memberRole };
  }

  async updateMemberRole(canvasId, ownerId, memberId, role) {
    this.validateObjectId(memberId, "member ID");
    const memberRole = this.validateMemberRole(role);
    const canvas = await this.requireOwner(canvasId, ownerId);
    const member = canvas.members.find(
      (item) => item.userId?.toString() === memberId,
    );
    if (!member) throw new AppError("Canvas member not found", 404);

    member.role = memberRole;
    await canvas.save();
    canvasSyncService.closeCanvasUserSessions(
      canvasId,
      memberId,
      "Canvas access changed. Reconnect to continue.",
    );
    const emails = await this.getMemberDetails([memberId]);
    return { userId: memberId, email: emails.get(memberId) || "", role: memberRole };
  }

  async removeMember(canvasId, ownerId, memberId) {
    this.validateObjectId(memberId, "member ID");
    const canvas = await this.requireOwner(canvasId, ownerId);
    const memberIndex = canvas.members.findIndex(
      (member) => member.userId?.toString() === memberId,
    );
    if (memberIndex === -1) throw new AppError("Canvas member not found", 404);

    canvas.members.splice(memberIndex, 1);
    await canvas.save();
    canvasSyncService.closeCanvasUserSessions(
      canvasId,
      memberId,
      "Canvas access has been revoked.",
    );
    return { userId: memberId };
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
    const canvas = await this.requireCanvas(canvasId);
    const role = this.getUserRole(canvas, userId);
    if (!role) {
      throw new AppError("You don't have access to this canvas", 403);
    }
    return { ...canvas.toObject(), role };
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
