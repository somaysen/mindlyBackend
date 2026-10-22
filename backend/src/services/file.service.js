import AppError from "../utils/error.js";
import logger from "../utils/logger.js";
import FileModel from "../models/file.model.js";
import Project from "../models/project.model.js";
import {
  deleteFile as deleteCloudinaryFile,
  uploadFile,
} from "../config/fileStore.js";

const MAX_FILE_SIZE = 700 * 1024;

function isMimeType(value) {
  return /^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+$/.test(value);
}

function parseFileData(fileData, suppliedMimeType) {
  if (typeof fileData !== "string" || !fileData.trim()) {
    throw new AppError("fileData must be a base64 data URI or base64 string", 400);
  }

  let value = fileData.trim();
  let mimeType =
    typeof suppliedMimeType === "string" && isMimeType(suppliedMimeType.trim())
      ? suppliedMimeType.trim()
      : "application/octet-stream";

  if (/^data:/i.test(value)) {
    const commaIndex = value.indexOf(",");
    if (commaIndex < 0) {
      throw new AppError("fileData must be a valid base64 data URI", 400);
    }

    const metadata = value.slice(5, commaIndex).split(";");
    if (metadata.length < 2 || metadata.at(-1).toLowerCase() !== "base64") {
      throw new AppError("fileData data URI must use base64 encoding", 400);
    }
    if (metadata[0] && isMimeType(metadata[0])) mimeType = metadata[0];
    value = value.slice(commaIndex + 1);
  }

  const base64 = value.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new AppError("fileData must contain valid base64 data", 400);
  }

  const unpadded = base64.replace(/=+$/, "");
  if (unpadded.length % 4 === 1) {
    throw new AppError("fileData must contain valid base64 data", 400);
  }

  const normalizedBase64 = unpadded + "=".repeat((4 - (unpadded.length % 4)) % 4);
  const buffer = Buffer.from(normalizedBase64, "base64");
  if (!buffer.length || buffer.toString("base64").replace(/=+$/, "") !== unpadded) {
    throw new AppError("fileData must contain valid base64 data", 400);
  }

  const size = buffer.byteLength;
  if (size > MAX_FILE_SIZE) {
    throw new AppError("File must be 700 KB or smaller", 413);
  }

  return {
    mimeType,
    size,
    dataUri: `data:${mimeType};base64,${normalizedBase64}`,
  };
}

class FileService {
  async listProjectFiles(userId, projectId) {
    const project = await Project.exists({ _id: projectId, user: userId });
    if (!project) throw new AppError("Project not found", 404);

    return FileModel.find({ userId, projectId }).sort({ createdAt: -1 });
  }

  async uploadProjectFile(
    userId,
    projectId,
    { title, fileData, mimeType: suppliedMimeType } = {},
  ) {
    const project = await Project.exists({ _id: projectId, user: userId });
    if (!project) throw new AppError("Project not found", 404);

    const { mimeType, size, dataUri } = parseFileData(fileData, suppliedMimeType);
    const normalizedTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : "Untitled document";
    if (normalizedTitle.length > 200) {
      throw new AppError("File title must be 200 characters or fewer", 400);
    }

    const uploaded = await uploadFile(dataUri, {
      folder: `mindly/projects/${projectId}`,
      resource_type: "auto",
    });

    let savedFile;
    try {
      savedFile = await FileModel.create({
        title: normalizedTitle,
        projectId,
        userId,
        cloudinaryPublicId: uploaded.public_id,
        cloudinaryResourceType: uploaded.resource_type,
        cloudinaryUrl: uploaded.secure_url,
        mimeType,
        format: uploaded.format || "",
        size,
      });

      const updatedProject = await Project.findOneAndUpdate(
        { _id: projectId, user: userId },
        { $push: { fileList: savedFile._id } },
        { returnDocument: "after", runValidators: true },
      );

      if (!updatedProject) throw new AppError("Project not found", 404);
      return savedFile;
    } catch (error) {
      logger.error(
        `Failed to save uploaded file metadata (${error?.name || "Error"}): ${error?.message || "Unknown database error"}`,
      );
      if (savedFile) await FileModel.deleteOne({ _id: savedFile._id });
      await deleteCloudinaryFile(uploaded.public_id, {
        resource_type: uploaded.resource_type,
      }).catch(() => {});
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to save uploaded file", 500);
    }
  }

  async deleteProjectFile(userId, projectId, fileId) {
    const file = await FileModel.findOne({ _id: fileId, userId, projectId });
    if (!file) throw new AppError("File not found", 404);

    await deleteCloudinaryFile(file.cloudinaryPublicId, {
      resource_type: file.cloudinaryResourceType,
    });

    await Promise.all([
      FileModel.deleteOne({ _id: file._id, userId, projectId }),
      Project.updateOne(
        { _id: projectId, user: userId },
        { $pull: { fileList: file._id } },
      ),
    ]);

    return file;
  }
}

export default new FileService();
