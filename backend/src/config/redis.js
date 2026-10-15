import redis from "redis";
import config from "./environment.js";
import logger from "../utils/logger.js";

const client = redis.createClient(
  config.REDIS_URL
    ? { url: config.REDIS_URL }
    : {
        password: config.REDIS_PASSWORD || undefined,
        socket: { host: config.REDIS_HOST, port: config.REDIS_PORT },
      },
);

client.on("error", (error) => {
  logger.error(`Redis connection error: ${error.message}`);
});

export async function connectRedis() {
  if (config.SKIP_REDIS) {
    logger.info("Redis disabled; using in-memory token revocation");
    return;
  }

  await client.connect();
  logger.info("Redis connected successfully");
}

export async function disconnectRedis() {
  if (!client.isOpen) return;
  if (client.isReady) {
    await client.quit();
  } else {
    client.destroy();
  }
}

export const redisClient = client;
export const getRedisClient = () => client;
