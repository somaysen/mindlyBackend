import config from "./environment.js";

const allowedOrigins = config.ALLOWED_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      config.NODE_ENV !== "production" &&
      /^http:\/\/localhost(?::\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const msg = `CORS policy: Origin ${origin} is not allowed`;

    return callback(new Error(msg));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ["Content-Type", "Authorization"],
};
