import redis from "redis";
import config from "./environment.js";
import logger from "../utils/logger.js";

const client = redis.createClient(
  config.REDIS_URL
    ? { url: config.REDIS_URL, socket: { connectTimeout: 5000 } }
    : {
        password: config.REDIS_PASSWORD || undefined,
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          connectTimeout: 5000,
        },
      },
);

client.on("error", (error) => {
  logger.error(`Redis connection error: ${error.message}`);
});

let connectionPromise;

export async function connectRedis() {
  if (config.SKIP_REDIS) {
    return;
  }

  if (client.isReady) return client;
  if (connectionPromise) return connectionPromise;

  connectionPromise = client
    .connect()
    .then(() => {
      logger.info("Redis connected successfully");
      return client;
    })
    .catch((error) => {
      connectionPromise = undefined;
      if (client.isOpen && !client.isReady) client.destroy();
      throw error;
    });

  return connectionPromise;
}

export async function disconnectRedis() {
  connectionPromise = undefined;
  if (!client.isOpen) return;
  if (client.isReady) {
    await client.quit();
  } else {
    client.destroy();
  }
}

export const redisClient = client;
export const getRedisClient = () => client;
