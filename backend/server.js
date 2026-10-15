import app from "./src/app.js";
import logger from "./src/utils/logger.js";
import {connectDB} from "./src/config/database.js";
import {connectRedis} from "./src/config/redis.js";
import  config from "./src/config/environment.js";

const PORT = config.PORT;

async function startServer() {
  try {
    await connectDB();
    logger.info("MongoDB connected successfully");

    await connectRedis();
    logger.info("Redis connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();
