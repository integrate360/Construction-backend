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
  adminAddAttendanceForUser,
  deleteAttendanceRecord,
<<<<<<< HEAD
  getUserProjects
=======
  getProjectAttendanceAdmin,
>>>>>>> 8f80c5ae6b972a8c239c7e6e7d4604901a2cc4db
} from "../controllers/attendanceController.js";

const router = express.Router();
router.post("/submit", authMiddleware, submitAttendance);
router.get("/my", authMiddleware, getMyAttendance);
router.get("/my-projects",authMiddleware, getUserProjects);
router.get("/today/status", authMiddleware, getTodayAttendanceStatus);
router.get("/daily-hours", authMiddleware, getDailyWorkingHours);
router.get("/status", authMiddleware, getAttendanceStatus);
router.get("/monthly-summary", authMiddleware, getMonthlySummary);
router.get("/project/:projectId", authMiddleware, getProjectAttendance);
router.get(
  "/project/admin/:projectId",
  authMiddleware,
  getProjectAttendanceAdmin,
);
router.get("/project/:projectId/timeline", authMiddleware, getProjectTimeline);
router.delete("/delete-history", authMiddleware, deleteAttendanceRecord);
router.put("/admin/edit", authMiddleware, adminEditAttendance);
router.post("/admin/add", authMiddleware, adminAddAttendanceForUser);

export default router;
