import config from "./environment.js";

const allowedOrigins = (config.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header (Postman, server-to-server).
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    // Allow localhost during development only.
    if (
      config.NODE_ENV !== "production" &&
      /^http:\/\/localhost(?::\d+)?$/.test(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    // Allow configured frontend origins.
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Log the rejected origin for debugging.
    console.warn(`CORS rejected origin: ${normalizedOrigin}`);

    return callback(null, false);
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
