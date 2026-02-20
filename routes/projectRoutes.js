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
router.put("/updateProject/:id", updateProject);
router.get("/getProjectStats/stats", getProjectStats);
router.get("/getProjectById/:id", getProjectById);
router.delete("/deleteProject/:id", deleteProject);
router.patch("/updateApprovalStatus/:id/approval", updateApprovalStatus);
router.patch(
  "/updatePhaseCompletion/:id/phases/:phaseIndex",
  updatePhaseCompletion,
);
router.post("/addDocument/:id/documents", addDocument);
router.delete("/removeDocument/:id/documents/:docId", removeDocument);

export default router;
