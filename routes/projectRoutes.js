import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateApprovalStatus,
  updatePhaseCompletion,
  addDocument,
  removeDocument,
  deleteProject,
  getProjectStats,
} from "../controllers/projectController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/getProjects", getProjects);
router.post("/createProject", createProject);
router.get("/stats", getProjectStats);
router.get("/:id", getProjectById);
router.put("/updateProject/:id", updateProject);
router.delete("/:id", deleteProject);
router.patch("/:id/approval", updateApprovalStatus);
router.patch("/:id/phases/:phaseIndex", updatePhaseCompletion);
router.post("/:id/documents", addDocument);
router.delete("/:id/documents/:docId", removeDocument);

export default router;