import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats,
  addProjectAttributes,
  updateAttributeQuantity,
  removeProjectAttribute,
  getProjectTeamByProjectId,
} from "../controllers/projectController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/getProjects", getProjects);
router.post("/createProject", createProject);
router.put("/updateProject/:id", updateProject);
router.get("/getProjectStats/stats", getProjectStats);
router.get("/getProjectById/:id", getProjectById);
router.delete("/deleteProject/:id", deleteProject);
router.post("/addProjectAttributes/:id", addProjectAttributes);
router.put("/updateAttributeQuantity/:projectId/:attributeId", updateAttributeQuantity);
router.delete("/removeProjectAttribute/:projectId/:attributeId", removeProjectAttribute);
router.get("/getProjectTeam/:projectId", getProjectTeamByProjectId);

export default router;
