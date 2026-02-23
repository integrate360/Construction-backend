import express from "express";
import {
  submitAttendance,
  getMyAttendance,
  getProjectAttendance,
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/submit", authMiddleware, submitAttendance);

router.get("/my", authMiddleware, getMyAttendance);

router.get("/project/:projectId", authMiddleware, getProjectAttendance);

export default router;
