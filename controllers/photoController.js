import Photos from "../models/Progressphotos.js";
import Project from "../models/Project.js";
import {
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
} from "../helpers/cloudinaryUpload.js";

export const uploadPhotos = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one photo",
      });
    }

    // Find or create photos document for this project
    let photosDoc = await Photos.findOne({ project: projectId });

    if (!photosDoc) {
      photosDoc = new Photos({
        project: projectId,
        photos: [],
      });
    }

    // Upload all photos to Cloudinary using helper
    const folder = `projects/${projectId}/photos`;
    const uploadResults = await uploadMultipleToCloudinary(req.files, folder);

    // Add photos to database
    const uploadedPhotos = [];

    for (const result of uploadResults) {
      const newPhoto = {
        url: result.url,
        cloudinaryId: result.publicId, // You might want to add this to your schema
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
      };

      photosDoc.photos.push(newPhoto);
      uploadedPhotos.push(newPhoto);
    }

    await photosDoc.save();

    res.status(201).json({
      success: true,
      message: `${uploadedPhotos.length} photos uploaded successfully`,
      data: {
        project: projectId,
        photos: uploadedPhotos,
      },
    });
  } catch (error) {
    console.error("Upload photos error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading photos",
      error: error.message,
    });
  }
};

export const uploadSinglePhoto = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a photo",
      });
    }

    // Find or create photos document for this project
    let photosDoc = await Photos.findOne({ project: projectId });

    if (!photosDoc) {
      photosDoc = new Photos({
        project: projectId,
        photos: [],
      });
    }

    // Upload single photo to Cloudinary using helper
    const folder = `projects/${projectId}/photos`;
    const uploadResult = await uploadToCloudinary(req.file, folder);

    // Add photo to database
    const newPhoto = {
      url: uploadResult.url,
      cloudinaryId: uploadResult.publicId,
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
    };

    photosDoc.photos.push(newPhoto);
    await photosDoc.save();

    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      data: newPhoto,
    });
  } catch (error) {
    console.error("Upload single photo error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading photo",
      error: error.message,
    });
  }
};

export const getProjectPhotos = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { approved } = req.query;

    const photosDoc = await Photos.findOne({ project: projectId })
      .populate("project", "name description")
      .populate("photos.approvedBy", "name email");

    if (!photosDoc) {
      return res.status(404).json({
        success: false,
        message: "No photos found for this project",
      });
    }

    // Filter by approval status if requested
    let photos = photosDoc.photos;
    if (approved !== undefined) {
      const isApproved = approved === "true";
      photos = photos.filter((photo) => photo.isApproved === isApproved);
    }

    res.status(200).json({
      success: true,
      data: {
        project: photosDoc.project,
        photos: photos,
        totalCount: photos.length,
      },
    });
  } catch (error) {
    console.error("Get project photos error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching photos",
      error: error.message,
    });
  }
};

export const getPhotoById = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photosDoc = await Photos.findOne(
      { "photos._id": photoId },
      { "photos.$": 1, project: 1 },
    )
      .populate("project", "name description")
      .populate("photos.approvedBy", "name email");

    if (!photosDoc || !photosDoc.photos || photosDoc.photos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    res.status(200).json({
      success: true,
      data: photosDoc.photos[0],
    });
  } catch (error) {
    console.error("Get photo by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching photo",
      error: error.message,
    });
  }
};

export const approvePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.id;

    const photosDoc = await Photos.findOne({ "photos._id": photoId });

    if (!photosDoc) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // Find the specific photo and update it
    const photo = photosDoc.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    photo.isApproved = true;
    photo.approvedBy = userId;
    photo.approvedAt = new Date();

    await photosDoc.save();

    res.status(200).json({
      success: true,
      message: "Photo approved successfully",
      data: photo,
    });
  } catch (error) {
    console.error("Approve photo error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving photo",
      error: error.message,
    });
  }
};

export const rejectPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photosDoc = await Photos.findOne({ "photos._id": photoId });

    if (!photosDoc) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    const photo = photosDoc.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    photo.isApproved = false;
    photo.approvedBy = null;
    photo.approvedAt = null;

    await photosDoc.save();

    res.status(200).json({
      success: true,
      message: "Photo rejected successfully",
      data: photo,
    });
  } catch (error) {
    console.error("Reject photo error:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting photo",
      error: error.message,
    });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photosDoc = await Photos.findOne({ "photos._id": photoId });

    if (!photosDoc) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    const photo = photosDoc.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // Delete from Cloudinary using helper
    if (photo.cloudinaryId) {
      await deleteFromCloudinary(photo.cloudinaryId);
    } else {
      // Fallback: extract public_id from URL
      try {
        const urlParts = photo.url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const publicId = `projects/${photosDoc.project}/photos/${fileName.split(".")[0]}`;
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
      }
    }

    // Remove from array
    photo.deleteOne();
    await photosDoc.save();

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting photo",
      error: error.message,
    });
  }
};

export const updatePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { isApproved } = req.body;

    const photosDoc = await Photos.findOne({ "photos._id": photoId });

    if (!photosDoc) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    const photo = photosDoc.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // Update fields
    if (isApproved !== undefined) {
      photo.isApproved = isApproved;
      if (isApproved) {
        photo.approvedBy = req.user.id;
        photo.approvedAt = new Date();
      } else {
        photo.approvedBy = null;
        photo.approvedAt = null;
      }
    }

    await photosDoc.save();

    res.status(200).json({
      success: true,
      message: "Photo updated successfully",
      data: photo,
    });
  } catch (error) {
    console.error("Update photo error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating photo",
      error: error.message,
    });
  }
};

export const getPhotoStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    const photosDoc = await Photos.findOne({ project: projectId });

    if (!photosDoc) {
      return res.status(200).json({
        success: true,
        data: {
          totalPhotos: 0,
          approvedPhotos: 0,
          pendingPhotos: 0,
          recentUploads: [],
        },
      });
    }

    const photos = photosDoc.photos;
    const stats = {
      totalPhotos: photos.length,
      approvedPhotos: photos.filter((p) => p.isApproved).length,
      pendingPhotos: photos.filter((p) => !p.isApproved).length,
      recentUploads: photos
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((p) => ({
          id: p._id,
          url: p.url,
          isApproved: p.isApproved,
          uploadedAt: p.createdAt,
        })),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get photo stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching photo statistics",
      error: error.message,
    });
  }
};
