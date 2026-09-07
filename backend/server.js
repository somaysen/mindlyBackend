import app from "./src/app.js";
import config from "./src/config/env.js";
import connectDB from "./src/config/db.js";

const PORT = config.PORT;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    })
  } catch (error) {
    console.error("Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();
