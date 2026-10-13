
import config from "./env.js";

const parseOrigins = (value) =>
  (Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [])
    .filter((origin) => typeof origin === "string")
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuredFrontendOrigin = (() => {
  try {
    return new URL(config.FRONTEND_URL).origin;
  } catch {
    return null;
  }
})();

const allowedOrigins = new Set([
  configuredFrontendOrigin,
  ...parseOrigins(config.CORS_ORIGINS),
  ...parseOrigins(config.ALLOWED_ORIGINS),
].filter(Boolean));

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost during development only.
    if (
      config.NODE_ENV === "development" &&
      /^https?:\/\/localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS policy: Origin ${origin} is not allowed`)
    );
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
