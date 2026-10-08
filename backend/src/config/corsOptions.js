import config from "./env.js";

const configuredFrontendOrigin = (() => {
  try {
    return new URL(config.FRONTEND_URL).origin;
  } catch {
    return null;
  }
})();

const allowedOrigins = new Set([
  configuredFrontendOrigin,
  ...config.CORS_ORIGINS,
].filter(Boolean));

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (/^https?:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    const msg = `CORS policy: Origin ${origin} is not allowed`;
 
    return callback(new Error(msg));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
