import redis from "redis";
import config from "./environment.js";
import logger from "../utils/logger.js";

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = config;

const client = redis.createClient({
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

client.on("error", (err) => {
  logger.error("Redis connection error:", err.message);
});

client.on("connect", () => {
  logger.info("✅ Redis connected successfully");
});

export async function connectRedis() {
  if (config.SKIP_REDIS) {
    logger.info("Redis disabled; using in-memory token revocation");
    return;
  }

  try {
    await client.connect();
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
}

export const redisClient = client;
export const getRedisClient = () => client;
