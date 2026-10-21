import AppError from "../utils/error.js";
import FileModel from "../models/file.model.js";
import Project from "../models/project.model.js";
import {
  deleteFile as deleteCloudinaryFile,
  uploadFile,
} from "../config/fileStore.js";

const MAX_FILE_SIZE = 700 * 1024;

function parseDataUri(dataUri) {
  if (typeof dataUri !== "string") {
    throw new AppError("fileData must be a base64 data URI", 400);
  }

  const match = dataUri.match(
    /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]*={0,2})$/,
  );
  if (!match || !match[2]) {
    throw new AppError("fileData must be a valid base64 data URI", 400);
  }

  const size = Buffer.from(match[2], "base64").byteLength;
  if (size > MAX_FILE_SIZE) {
    throw new AppError("File must be 700 KB or smaller", 413);
  }

  return { mimeType: match[1], size };
}

function mapFileToProject(file) {
  return {
    fileId: file._id,
    name: file.title,
    url: file.cloudinaryUrl,
    cloudinaryPublicId: file.cloudinaryPublicId,
    mimeType: file.mimeType,
    size: file.size,
  };
}

class FileService {
  async listProjectFiles(userId, projectId) {
    const project = await Project.exists({ _id: projectId, user: userId });
    if (!project) throw new AppError("Project not found", 404);

    return FileModel.find({ userId, projectId }).sort({ createdAt: -1 });
  }

  async uploadProjectFile(userId, projectId, { title, fileData } = {}) {
    const project = await Project.exists({ _id: projectId, user: userId });
    if (!project) throw new AppError("Project not found", 404);

    const { mimeType, size } = parseDataUri(fileData);
    const normalizedTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : "Untitled document";
    if (normalizedTitle.length > 200) {
      throw new AppError("File title must be 200 characters or fewer", 400);
    }

    const uploaded = await uploadFile(fileData, {
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
        { $push: { fileList: mapFileToProject(savedFile) } },
        { new: true, runValidators: true },
      );

      if (!updatedProject) throw new AppError("Project not found", 404);
      return savedFile;
    } catch (error) {
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
        { $pull: { fileList: { fileId: file._id } } },
      ),
    ]);

    return file;
  }
}

export default new FileService();
