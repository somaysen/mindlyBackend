import app from "./src/app.js";
import config from "./src/config/env.js";
import connectDB from "./src/config/db.js";
import logger from "./src/utils/logger.js";

const PORT = config.PORT;

async function startServer() {
  try {
    await connectDB()

    app.listen(PORT, () => {
        logger.info(`Server is running at http://localhost:${PORT}`);
    })
  } catch (error) {
    logger.error("Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();
