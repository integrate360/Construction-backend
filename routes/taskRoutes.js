import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  completeTask,
  carryForwardTasks,
  getLabourTaskSummary,
  getProjectTaskDashboard,
  triggerAutoCarryForward,
  getMyTasks,
} from "../controllers/taskController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

router.get("/tasks", getTasks);

router.get("/my-tasks", getMyTasks);

router.post("/createTask", createTask);

router.get("/tasks/:id", getTaskById);

router.put("/tasks/:id", updateTask);

router.put("/tasks/:id/complete", completeTask);

router.get("/tasks/summary/labour/:labourId", getLabourTaskSummary);

router.get("/tasks/dashboard/project/:projectId", getProjectTaskDashboard);

router.post("/tasks/auto-carry-forward", triggerAutoCarryForward);

export default router;