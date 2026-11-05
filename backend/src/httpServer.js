import { createServer } from "node:http";
import app from "./app.js";
import canvasSyncService from "./services/canvasSync.service.js";

const server = createServer(app);
canvasSyncService.attachCanvasWebSocket(server);

export default server;
