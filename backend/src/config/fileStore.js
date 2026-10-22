import { v2 as cloudinary } from "cloudinary";
import config from "./environment.js";
import AppError from "../utils/error.js";
import logger from "../utils/logger.js";

function credentialsFromUrl(value) {
  if (!value) return {};

  try {
    const url = new URL(value);
    if (url.protocol !== "cloudinary:") return {};

    return {
      cloud_name: url.hostname,
      api_key: decodeURIComponent(url.username),
      api_secret: decodeURIComponent(url.password),
    };
  } catch {
    return {};
  }
}

const urlCredentials = credentialsFromUrl(config.CLOUDINARY_URL);
const credentials = {
  // Treat CLOUDINARY_URL as one credential set so settings from different
  // Cloudinary accounts cannot be mixed together.
  cloud_name: urlCredentials.cloud_name || config.CLOUDINARY_CLOUD_NAME,
  api_key: urlCredentials.api_key || config.CLOUDINARY_API_KEY,
  api_secret: urlCredentials.api_secret || config.CLOUDINARY_API_SECRET,
};

const configuredCredentialCount = Object.values(credentials).filter(Boolean).length;
const isConfigured = configuredCredentialCount === Object.keys(credentials).length;

if (isConfigured) {
  cloudinary.config({ ...credentials, secure: true });
}

function requireCloudinary() {
  if (!isConfigured) {
    throw new AppError("Cloudinary is not configured", 503);
  }
}

function validateSource(source) {
  if (typeof source !== "string" || !source.trim()) {
    throw new AppError("A file path, URL, or data URI is required", 400);
  }
}

function getSafeProviderError(error) {
  let message = String(
    error?.error?.message || error?.message || "Unknown Cloudinary error",
  );

  for (const secret of [credentials.api_key, credentials.api_secret]) {
    if (secret) message = message.replaceAll(secret, "[redacted]");
  }

  return message
    .replace(/cloudinary:\/\/[^\s@]+@[^\s]+/gi, "cloudinary://[redacted]")
    .replace(/data:[^\s,]+;base64,[A-Za-z0-9+/=]+/gi, "[file data redacted]")
    .slice(0, 500);
}

/** Upload a local path, remote URL, or data URI to Cloudinary. */
export async function uploadFile(source, options = {}) {
  requireCloudinary();
  validateSource(source);

  try {
    return await cloudinary.uploader.upload(source, {
      resource_type: "auto",
      ...options,
    });
  } catch (error) {
    const status = Number(error?.http_code || error?.statusCode);
    logger.error(
      `Cloudinary upload failed${Number.isInteger(status) ? ` (HTTP ${status})` : ""}: ${getSafeProviderError(error)}`,
    );
    throw new AppError("Cloudinary upload failed", 502);
  }
}

/** Remove an asset by its Cloudinary public ID. */
export async function deleteFile(publicId, options = {}) {
  requireCloudinary();
  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError("A Cloudinary public ID is required", 400);
  }

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      ...options,
    });
  } catch (error) {
    throw new AppError("Cloudinary delete failed", 502);
  }
}

/** Build a secure delivery URL, optionally applying Cloudinary transformations. */
export function getFileUrl(publicId, options = {}) {
  requireCloudinary();
  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError("A Cloudinary public ID is required", 400);
  }

  return cloudinary.url(publicId, { secure: true, ...options });
}

export { cloudinary, isConfigured as isCloudinaryConfigured };
export default cloudinary;
