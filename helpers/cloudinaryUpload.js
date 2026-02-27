import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

export const uploadToCloudinary = async (file, folder = "uploads") => {
  try {
    if (!file || !file.path) {
      throw new Error("File path is required");
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: "auto",
    });

    // Remove file from local storage after upload
    fs.unlinkSync(file.path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    // Clean up local file if upload fails
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

export const uploadMultipleToCloudinary = async (files, folder = "uploads") => {
  try {
    if (!files || files.length === 0) {
      throw new Error("Files are required");
    }

    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, folder),
    );
    const results = await Promise.all(uploadPromises);

    return results;
  } catch (error) {
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required");
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

export const extractPublicIdFromUrl = (url) => {
  try {
    const urlParts = url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const folderPath = urlParts.slice(urlParts.indexOf("upload") + 2).join("/");
    return folderPath.split(".")[0]; // Remove file extension
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};
