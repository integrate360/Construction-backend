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

router.use(authMiddleware);

router.get("/project/:projectId/stats", getPhotoStats);

router.get("/project/:projectId", getProjectPhotos);

router.post("/upload/:projectId", uploadMultiple, uploadPhotos);

router.post("/uploadSinglePhoto/upload-single/:projectId", uploadSingle, uploadSinglePhoto);

router.get("/photo/:photoId", getPhotoById);

router.put("/updatePhoto/:photoId", updatePhoto);

router.delete("/deletePhoto/:photoId", deletePhoto);

router.put("/approvePhoto/:photoId/approve", approvePhoto);

router.put("/rejectPhoto/:photoId/reject", rejectPhoto);

export default router;
