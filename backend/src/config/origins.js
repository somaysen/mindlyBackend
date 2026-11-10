import config from "./environment.js";

function normalizeOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins() {
  const origins = new Set(
    config.ALLOWED_ORIGINS.split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean),
  );

  const frontendOrigin = normalizeOrigin(config.FRONTEND_URL);
  if (frontendOrigin) origins.add(frontendOrigin);
  return origins;
}

export function isAllowedOrigin(origin) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  if (
    config.NODE_ENV !== "production" &&
    /^http:\/\/localhost(?::\d+)?$/.test(normalizedOrigin)
  ) {
    return true;
  }

  return getAllowedOrigins().has(normalizedOrigin);
}
