import { isAllowedOrigin } from "./origins.js";

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header (Postman, server-to-server).
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
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
