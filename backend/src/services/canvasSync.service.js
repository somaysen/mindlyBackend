import { randomUUID } from "node:crypto";
import { TLSocketRoom } from "@tldraw/sync-core";
import jwt from "jsonwebtoken";
import WebSocket, { WebSocketServer } from "ws";
import CanvasModel from "../models/CanvasModel.js";
import config from "../config/environment.js";
import { connectDB } from "../config/database.js";
import AppError from "../utils/error.js";
import logger from "../utils/logger.js";

const canvasPath = /^\/api\/canvas\/([^/]+)\/sync$/;

class CanvasSyncService {
  constructor() {
    this.websocketServer = new WebSocketServer({
      noServer: true,
      maxPayload: 10 * 1024 * 1024,
    });
    this.rooms = new Map();
    this.roomLoads = new Map();
    this.shuttingDown = false;
  }

  getAllowedOrigins() {
    const origins = new Set(
      config.ALLOWED_ORIGINS
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
    try {
      origins.add(new URL(config.FRONTEND_URL).origin);
    } catch {
      // The app validates FRONTEND_URL during startup.
    }
    return origins;
  }

  rejectUpgrade(socket, statusCode, message) {
    if (socket.destroyed) return;
    const statusText = statusCode === 401
      ? "Unauthorized"
      : statusCode === 403
        ? "Forbidden"
        : statusCode === 404
          ? "Not Found"
          : statusCode === 503
            ? "Service Unavailable"
            : "Bad Request";
    socket.end(
      `HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`,
    );
  }

  scheduleRoomEviction(entry) {
    if (entry.closed || entry.room.getNumActiveSessions() !== 0) return;
    clearTimeout(entry.evictionTimer);
    entry.evictionTimer = setTimeout(() => {
      if (
        entry.closed ||
        entry.sockets.size > 0 ||
        entry.room.getNumActiveSessions() > 0 ||
        this.rooms.get(entry.canvasId) !== entry
      ) {
        return;
      }

      entry.closed = true;
      void this.persistRoomSnapshot(entry, true)
        .catch(() => {
          // persistRoomSnapshot logs persistence errors before rejecting.
        })
        .finally(() => {
          entry.room.close();
          if (this.rooms.get(entry.canvasId) === entry) {
            this.rooms.delete(entry.canvasId);
          }
        });
    }, 60_000);
    entry.evictionTimer.unref();
  }

  persistRoomSnapshot(entry, allowClosed = false) {
    if (entry.closed && !allowClosed) return entry.pendingWrites;

    const snapshot = entry.room.getCurrentSnapshot();
    const write = entry.pendingWrites
      .catch(() => {})
      .then(async () => {
        if (entry.closed && !allowClosed) return;
        const result = await CanvasModel.updateOne(
          { _id: entry.canvasId },
          { $set: { snapshot } },
        );
        if (result.matchedCount === 0) {
          throw new AppError("Canvas no longer exists", 404);
        }
      });
    entry.pendingWrites = write;
    return write.catch((error) => {
        logger.error(
          `Canvas ${entry.canvasId} snapshot persistence failed: ${error.message}`,
        );
        for (const socket of entry.sockets) {
          socket.close(1011, "Canvas persistence failed");
        }
        throw error;
      });
  }

  async getOrCreateRoom(canvasId, initialSnapshot) {
    const current = this.rooms.get(canvasId);
    if (current && !current.closed) {
      clearTimeout(current.evictionTimer);
      return current;
    }
    if (current?.closed) {
      await current.pendingWrites;
      if (this.rooms.get(canvasId) === current) this.rooms.delete(canvasId);
      initialSnapshot = undefined;
    }

    let roomPromise = this.roomLoads.get(canvasId);
    if (!roomPromise) {
      roomPromise = (async () => {
        let snapshot = initialSnapshot;
        if (snapshot === undefined) {
          const canvas = await CanvasModel.findById(canvasId)
            .select("snapshot")
            .lean();
          if (!canvas) throw new AppError("Canvas not found", 404);
          snapshot = canvas.snapshot;
        }

        let entry;
        const room = new TLSocketRoom({
          ...(snapshot ? { initialSnapshot: snapshot } : {}),
          onDataChange: () => {
            void this.persistRoomSnapshot(entry).catch(() => {});
          },
          onSessionRemoved: (_room, { numSessionsRemaining }) => {
            if (numSessionsRemaining === 0) this.scheduleRoomEviction(entry);
          },
          log: {
            error: (error) => {
              logger.error(
                `Canvas ${canvasId} sync error: ${error?.message || error}`,
              );
            },
          },
        });

        entry = {
          canvasId,
          room,
          sockets: new Set(),
          socketUsers: new Map(),
          pendingWrites: Promise.resolve(),
          evictionTimer: null,
          closed: false,
        };
        this.rooms.set(canvasId, entry);
        return entry;
      })();
      this.roomLoads.set(canvasId, roomPromise);
    }

    try {
      return await roomPromise;
    } finally {
      if (this.roomLoads.get(canvasId) === roomPromise) {
        this.roomLoads.delete(canvasId);
      }
    }
  }

  async handleCanvasUpgrade(request, socket, head, canvasId) {
    if (this.shuttingDown) {
      throw new AppError("Canvas sync is unavailable", 503);
    }
    if (!config.SYNC_TICKET_SECRET) {
      throw new AppError("Canvas sync is not configured", 503);
    }

    const origin = request.headers.origin;
    if (origin && !this.getAllowedOrigins().has(origin)) {
      throw new AppError("Request origin is not allowed", 403);
    }

    let url;
    try {
      url = new URL(request.url, "http://localhost");
    } catch {
      throw new AppError("Invalid WebSocket URL", 400);
    }

    const ticket = url.searchParams.get("token") || url.searchParams.get("ticket");
    if (!ticket) throw new AppError("Canvas sync ticket is required", 401);

    let claims;
    try {
      claims = jwt.verify(ticket, config.SYNC_TICKET_SECRET, {
        audience: "mindly-canvas",
        issuer: "mindly-api",
      });
    } catch {
      throw new AppError("Canvas sync ticket is invalid or expired", 401);
    }

    if (
      typeof claims !== "object" ||
      claims.purpose !== "canvas-sync" ||
      claims.canvasId !== canvasId ||
      typeof claims.sub !== "string"
    ) {
      throw new AppError("Canvas sync ticket is invalid", 401);
    }

    await connectDB();
    const canvas = await CanvasModel.findById(canvasId)
      .select("ownerId members snapshot")
      .lean();
    if (!canvas) throw new AppError("Canvas not found", 404);
    const isOwner = canvas.ownerId.toString() === claims.sub;
    const member = (canvas.members || []).find(
      (item) => item.userId?.toString() === claims.sub,
    );
    if (!isOwner && !member) {
      throw new AppError("You don't have access to this canvas", 403);
    }

    const role = isOwner ? "owner" : member.role;
    if (!["owner", "editor", "viewer"].includes(role)) {
      throw new AppError("Canvas role is invalid", 403);
    }

    const entry = await this.getOrCreateRoom(canvasId, canvas.snapshot);
    if (this.shuttingDown || entry.closed) {
      throw new AppError("Canvas sync is unavailable", 503);
    }

    const currentCanvas = await CanvasModel.findById(canvasId)
      .select("ownerId members")
      .lean();
    if (!currentCanvas) throw new AppError("Canvas not found", 404);
    const isCurrentOwner = currentCanvas.ownerId.toString() === claims.sub;
    const currentMember = (currentCanvas.members || []).find(
      (item) => item.userId?.toString() === claims.sub,
    );
    if (!isCurrentOwner && !currentMember) {
      throw new AppError("You don't have access to this canvas", 403);
    }
    const currentRole = isCurrentOwner ? "owner" : currentMember.role;
    if (!["owner", "editor", "viewer"].includes(currentRole)) {
      throw new AppError("Canvas role is invalid", 403);
    }

    this.websocketServer.handleUpgrade(request, socket, head, (clientSocket) => {
      try {
        entry.sockets.add(clientSocket);
        entry.socketUsers.set(clientSocket, claims.sub);
        const removeSocket = () => {
          entry.sockets.delete(clientSocket);
          entry.socketUsers.delete(clientSocket);
        };
        clientSocket.once("close", removeSocket);
        clientSocket.once("error", removeSocket);
        entry.room.handleSocketConnect({
          sessionId: randomUUID(),
          socket: clientSocket,
          isReadonly: currentRole === "viewer",
        });
      } catch (error) {
        logger.error(
          `Canvas ${canvasId} WebSocket connection failed: ${error.message}`,
        );
        entry.sockets.delete(clientSocket);
        entry.socketUsers.delete(clientSocket);
        clientSocket.close(1011, "Canvas sync is unavailable");
      }
    });
  }

  closeCanvasUserSessions(canvasId, userId, reason) {
    const entry = this.rooms.get(canvasId);
    if (!entry || entry.closed) return;

    for (const [socket, connectedUserId] of entry.socketUsers) {
      if (connectedUserId === userId && socket.readyState === WebSocket.OPEN) {
        socket.close(1008, reason);
      }
    }
  }

  attachCanvasWebSocket(server) {
    server.on("upgrade", (request, socket, head) => {
      let url;
      try {
        url = new URL(request.url, "http://localhost");
      } catch {
        return;
      }

      if (!url.pathname.startsWith("/api/canvas/")) return;
      const match = url.pathname.match(canvasPath);
      if (!match) {
        this.rejectUpgrade(socket, 404, "Canvas sync endpoint not found");
        return;
      }

      const canvasId = match[1];
      if (!/^[\da-f]{24}$/i.test(canvasId)) {
        this.rejectUpgrade(socket, 400, "Invalid canvas ID");
        return;
      }

      void this.handleCanvasUpgrade(request, socket, head, canvasId).catch(
        (error) => {
          const statusCode = error.statusCode || 500;
          if (statusCode >= 500) {
            logger.error(
              `Canvas WebSocket upgrade failed: ${error.stack || error.message}`,
            );
          }
          this.rejectUpgrade(
            socket,
            statusCode,
            statusCode >= 500
              ? "Canvas sync is temporarily unavailable"
              : error.message,
          );
        },
      );
    });
  }

  async closeCanvasRoom(canvasId) {
    let entry = this.rooms.get(canvasId);
    if (!entry) {
      const roomPromise = this.roomLoads.get(canvasId);
      if (!roomPromise) return;
      try {
        entry = await roomPromise;
      } catch (error) {
        if (error.statusCode === 404) return;
        throw error;
      }
    }

    if (!entry || entry.closed) return;
    entry.closed = true;
    clearTimeout(entry.evictionTimer);
    entry.room.close();
    for (const socket of entry.sockets) {
      socket.close(1008, "Canvas is no longer available");
    }
    this.rooms.delete(canvasId);
    await entry.pendingWrites;
  }

  async shutdown() {
    this.shuttingDown = true;
    await Promise.all(
      [...this.roomLoads.values()].map(async (roomPromise) => {
        try {
          await roomPromise;
        } catch (error) {
          if (error.statusCode !== 404) {
            logger.error(
              `Canvas room load failed during shutdown: ${error.message}`,
            );
          }
        }
      }),
    );
    const entries = [...new Set(this.rooms.values())];

    await Promise.all(entries.map(async (entry) => {
      clearTimeout(entry.evictionTimer);
      entry.closed = true;
      entry.room.close();
      for (const socket of entry.sockets) socket.terminate();
      await this.persistRoomSnapshot(entry, true);
      await entry.pendingWrites;
    }));
    this.rooms.clear();
  }
}

export default new CanvasSyncService();
