import app from "./src/app.js";
import logger from "./src/utils/logger.js";
import { connectDB, disconnectDB } from "./src/config/database.js";
import { connectRedis, disconnectRedis } from "./src/config/redis.js";
import config from "./src/config/environment.js";
import { createServer } from "node:http";

const server = createServer(app);

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    server.listen(config.PORT, () => {
      logger.info(`Server is listening on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error(`Unable to start the server: ${error.message}`);
    await shutdown(1);
  }
}

let shuttingDown = false;
async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }

  try {
    await Promise.all([disconnectRedis(), disconnectDB()]);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    exitCode = 1;
  }
  process.exitCode = exitCode;
}

server.on("error", (error) => {
  logger.error(`HTTP server error: ${error.message}`);
  void shutdown(1);
});

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

startServer();
