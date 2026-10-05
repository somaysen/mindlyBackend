import Redis from "ioredis";
import config from "./env.js";
import logger from "../utils/logger.js";

const redisClient = new Redis(config.REDIS_URL, {
  password: config.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  // Keep reconnecting after transient network failures such as ECONNRESET.
  retryStrategy: (attempt) => Math.min(attempt * 500, 5000),
  // Fail requests promptly while the client reconnects in the background.
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redisClient.on("error", (error) => {
  logger.error(`Redis connection error: ${error.message}`);
});

redisClient.on("connect", () => {
  logger.info("Redis connected successfully");
});

export async function connectRedis() {
  if (config.SKIP_REDIS) {
    logger.warn("Redis connection skipped by configuration");
    return null;
  }

  if (redisClient.status === "ready") {
    return redisClient;
  }

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
    throw error;
  }
}

export const getRedisClient = () => redisClient;
export { redisClient };
