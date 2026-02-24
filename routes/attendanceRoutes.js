import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";

import {
  submitAttendance,
  getMyAttendance,
  getTodayAttendanceStatus,
  getDailyWorkingHours,
  getMonthlySummary,
  getAttendanceStatus,
  getProjectAttendance,
  getProjectTimeline,
  adminEditAttendance,
  adminAddAttendanceForLabour,
} from "../controllers/attendanceController.js";

const router = express.Router();
router.post("/submit", authMiddleware, submitAttendance);
router.get("/my", authMiddleware, getMyAttendance);
router.get("/today/status", authMiddleware, getTodayAttendanceStatus);
router.get("/daily-hours", authMiddleware, getDailyWorkingHours);
router.get("/status", authMiddleware, getAttendanceStatus);
router.get("/monthly-summary", authMiddleware, getMonthlySummary);
router.get("/project/:projectId", authMiddleware, getProjectAttendance);
router.get("/project/:projectId/timeline", authMiddleware, getProjectTimeline);
router.put("/admin/edit", authMiddleware, adminEditAttendance);
router.post(
  "/admin/add",
  authMiddleware,
  adminAddAttendanceForLabour
);

export default router;
