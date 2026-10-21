import { v2 as cloudinary } from "cloudinary";
import config from "./environment.js";
import AppError from "../utils/error.js";

const credentials = {
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
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
