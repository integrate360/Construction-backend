import express from "express";
import {
  uploadPhotos,
  uploadSinglePhoto,
  getProjectPhotos,
  getPhotoById,
  approvePhoto,
  rejectPhoto,
  deletePhoto,
  updatePhoto,
  getPhotoStats,
} from "../controllers/photoController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  uploadMultiple,
  uploadSingle,
} from "../middleware/uploadPhotosMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Photo statistics route
router.get("/project/:projectId/stats", getPhotoStats);

// Project photos routes
router.route("/project/:projectId").get(getProjectPhotos);

// Upload multiple photos route
router.post("/upload/:projectId", uploadMultiple, uploadPhotos);

// Upload single photo route
router.post("/upload-single/:projectId", uploadSingle, uploadSinglePhoto);

// Single photo routes
router
  .route("/:photoId")
  .get(getPhotoById)
  .put(updatePhoto)
  .delete(deletePhoto);

// Approval routes
router.put("/:photoId/approve", authMiddleware, approvePhoto);
router.put("/:photoId/reject", authMiddleware, rejectPhoto);

export default router;
