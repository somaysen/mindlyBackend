import config from "../config/environment.js";
import { getRedisClient } from "../config/redis.js";
import AppError from "../utils/error.js";

const developmentBuckets = new Map();
const windowSeconds = Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000);
const maxDevelopmentBuckets = 10_000;

const rememberDevelopmentBucket = (key, expiresAt) => {
  if (developmentBuckets.size >= maxDevelopmentBuckets) {
    const now = Date.now();
    for (const [existingKey, bucket] of developmentBuckets) {
      if (bucket.expiresAt <= now) developmentBuckets.delete(existingKey);
    }
    if (developmentBuckets.size >= maxDevelopmentBuckets) {
      developmentBuckets.delete(developmentBuckets.keys().next().value);
    }
  }
  developmentBuckets.set(key, { count: 1, expiresAt });
};

const authRateLimit = async (req, res, next) => {
  const clientKey = encodeURIComponent(req.ip || req.socket.remoteAddress || "unknown");
  const routeKey = encodeURIComponent(req.path);
  const key = `rate_limit:auth:${routeKey}:${clientKey}`;

  try {
    let count;
    const redis = getRedisClient();

    if (config.SKIP_REDIS && config.NODE_ENV !== "production") {
      const now = Date.now();
      const bucket = developmentBuckets.get(key);

      if (!bucket || bucket.expiresAt <= now) {
        rememberDevelopmentBucket(key, now + config.RATE_LIMIT_WINDOW_MS);
        count = 1;
      } else {
        bucket.count += 1;
        count = bucket.count;
      }
    } else {
      if (!redis.isReady) {
        throw new AppError("Authentication service temporarily unavailable", 503);
      }

      count = await redis.eval(
        "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
        { keys: [key], arguments: [String(windowSeconds)] },
      );
    }

    if (count > config.AUTH_RATE_LIMIT_MAX_REQUESTS) {
      const retryAfter = config.SKIP_REDIS
        ? Math.max(
            1,
            Math.ceil(
              ((developmentBuckets.get(key)?.expiresAt || Date.now()) - Date.now()) /
                1000,
            ),
          )
        : Math.max(1, Number(await redis.ttl(key)) || windowSeconds);

      res.set("Retry-After", String(retryAfter));
      return next(new AppError("Too many authentication requests. Try again later.", 429));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default authRateLimit;
