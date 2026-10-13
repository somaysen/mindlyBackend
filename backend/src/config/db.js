import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoURI = config.MONGODB;

    if (!mongoURI) {
      throw new Error("MONGODB URI is not configured");
    }

    connectionPromise = mongoose
      .connect(mongoURI, { serverSelectionTimeoutMS: 10000 })
      .then(async () => {
        const db = mongoose.connection.db;
        const usersCollectionExists = await db
          .listCollections({ name: "users" }, { nameOnly: true })
          .hasNext();

        if (usersCollectionExists) {
          const usersCollection = db.collection("users");
          const indexes = await usersCollection.indexes();
          const obsoleteEmailIndex = indexes.find(
            (index) =>
              index.unique === true &&
              index.key?.email === 1 &&
              Object.keys(index.key).length === 1,
          );

          if (obsoleteEmailIndex) {
            await usersCollection.dropIndex(obsoleteEmailIndex.name);
            logger.warn(
              `Removed obsolete unique index ${obsoleteEmailIndex.name} from users collection`,
            );
          }
        }

        logger.info("MongoDB connected successfully");
        return mongoose.connection;
      })
      .catch((error) => {
        logger.error(`MongoDB connection failed: ${error.message}`);
        throw error;
      })
      .finally(() => {
        connectionPromise = undefined;
      });
  }

  return connectionPromise;
};

export default connectDB;
