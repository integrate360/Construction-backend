import Attendance from "../models/Attendance.js";
import Project from "../models/Project.js";
import { getDistanceInMeters } from "../helpers/geoDistance.js";

export const submitAttendance = async (req, res) => {
  try {
    const { projectId, attendanceType, selfieImage, coordinates } = req.body;

    // 🔐 Auth
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "labour") {
      return res.status(403).json({
        success: false,
        message: "Only labour can mark attendance",
      });
    }

    if (!projectId || !attendanceType || !selfieImage || !coordinates) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be [longitude, latitude]",
      });
    }

    // 🔍 Project
    const project = await Project.findById(projectId);
    if (!project || !project.location?.coordinates?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Project location not configured",
      });
    }

    // 📏 Distance check
    const [projectLng, projectLat] = project.location.coordinates.coordinates;
    const [userLng, userLat] = coordinates;

    const distance = getDistanceInMeters(
      projectLat,
      projectLng,
      userLat,
      userLng,
    );

    if (distance > 10) {
      return res.status(403).json({
        success: false,
        message: "Attendance allowed only within 10 meters",
      });
    }

    // 🔍 Find attendance document (ONE per user+project)
    let attendanceDoc = await Attendance.findOne({
      user: req.user._id,
      project: projectId,
    });

    // 🆕 Create document if first time
    if (!attendanceDoc) {
      attendanceDoc = await Attendance.create({
        user: req.user._id,
        project: projectId,
        history: [],
      });
    }

    // 🔎 Last history entry
    const lastEntry = attendanceDoc.history[attendanceDoc.history.length - 1];

    // 🚫 Rules
    if (
      attendanceType === "check-in" &&
      lastEntry?.attendanceType === "check-in"
    ) {
      return res.status(400).json({
        success: false,
        message: "Already checked in. Please check out first.",
      });
    }

    if (
      attendanceType === "check-out" &&
      (!lastEntry || lastEntry.attendanceType !== "check-in")
    ) {
      return res.status(400).json({
        success: false,
        message: "You must check in before checking out.",
      });
    }

    // ✅ PUSH TO HISTORY
    attendanceDoc.history.push({
      attendanceType,
      selfieImage,
      location: {
        type: "Point",
        coordinates,
      },
    });

    await attendanceDoc.save();

    return res.status(201).json({
      success: true,
      message: "Attendance saved successfully",
      history: attendanceDoc.history,
    });
  } catch (error) {
    console.error("Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ user: req.user._id })
      .populate("project", "projectName siteName")
      .sort({ createdAt: -1 });

    // Group attendance by date for better history view
    const attendanceHistory = attendance.reduce((acc, record) => {
      const date = record.createdAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      history: attendanceHistory,
      totalRecords: attendance.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getProjectAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      project: req.params.projectId,
    })
      .populate("user", "name phoneNumber")
      .sort({ createdAt: -1 });

    // Group attendance by user and date for better project management
    const projectAttendance = attendance.reduce((acc, record) => {
      const userId = record.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: record.user,
          attendance: [],
        };
      }
      acc[userId].attendance.push(record);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      attendance: projectAttendance,
      totalRecords: attendance.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getTodayAttendanceStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find attendance for today
    const attendance = await Attendance.findOne({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // ❌ No attendance document
    if (!attendance || attendance.history.length === 0) {
      return res.status(200).json({
        success: true,
        status: "not-marked",
      });
    }

    // Get last history entry
    const lastEntry = attendance.history[attendance.history.length - 1];

    // ✅ Checked in but not checked out
    if (lastEntry.attendanceType === "check-in") {
      return res.status(200).json({
        success: true,
        status: "checked-in",
      });
    }

    // ✅ Checked out
    if (lastEntry.attendanceType === "check-out") {
      return res.status(200).json({
        success: true,
        status: "checked-out",
      });
    }

    // Fallback
    return res.status(200).json({
      success: true,
      status: "not-marked",
    });
  } catch (error) {
    console.error("Today Attendance Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getDailyWorkingHours = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const attendance = await Attendance.findOne({
      user: req.user._id,
    });

    if (!attendance) return res.json({ totalHours: 0 });

    const records = attendance.history.filter(
      (h) => h.createdAt >= start && h.createdAt < end,
    );

    let totalMs = 0;
    let lastCheckIn = null;

    for (const r of records) {
      if (r.attendanceType === "check-in") {
        lastCheckIn = r.createdAt;
      }
      if (r.attendanceType === "check-out" && lastCheckIn) {
        totalMs += r.createdAt - lastCheckIn;
        lastCheckIn = null;
      }
    }

    res.json({
      success: true,
      totalHours: (totalMs / (1000 * 60 * 60)).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query; // month: 1-12
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const attendance = await Attendance.findOne({
      user: req.user._id,
    });

    if (!attendance) return res.json({ daysWorked: 0 });

    const monthlyHistory = attendance.history.filter(
      (h) => h.createdAt >= start && h.createdAt < end,
    );

    const days = new Set(
      monthlyHistory.map((h) => h.createdAt.toISOString().split("T")[0]),
    );

    res.json({
      success: true,
      totalEntries: monthlyHistory.length,
      daysWorked: days.size,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminEditAttendance = async (req, res) => {
  try {
    const { attendanceId, historyIndex, attendanceType } = req.body;

    // Validate type
    if (!["check-in", "check-out"].includes(attendanceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance type",
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔴 IMPORTANT CHECK
    if (
      !attendance.history ||
      historyIndex < 0 ||
      historyIndex >= attendance.history.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid history index",
      });
    }

    attendance.history[historyIndex].attendanceType = attendanceType;
    attendance.history[historyIndex].editedByAdmin = true;
    attendance.history[historyIndex].editedAt = new Date();

    await attendance.save();

    res.json({
      success: true,
      message: "Attendance corrected",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAttendanceStatus = async (req, res) => {
  try {
    const { date } = req.query;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const attendance = await Attendance.findOne({
      user: req.user._id,
    });

    if (!attendance) return res.json({ status: "absent" });

    const dayHistory = attendance.history.filter(
      (h) => h.createdAt >= start && h.createdAt < end,
    );

    if (!dayHistory.length) return res.json({ status: "absent" });

    const firstCheckIn = dayHistory.find(
      (h) => h.attendanceType === "check-in",
    );

    const late = firstCheckIn && firstCheckIn.createdAt.getHours() > 9;

    res.json({
      success: true,
      status: late ? "late" : "present",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getProjectTimeline = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      project: req.params.projectId,
    }).populate("user", "name");

    const timeline = attendance.map((a) => ({
      user: a.user.name,
      history: a.history,
    }));

    res.json({ success: true, timeline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminAddAttendanceForLabour = async (req, res) => {
  try {
    const {
      labourId,
      projectId,
      attendanceType,
      selfieImage,
      coordinates,
      createdAt,
    } = req.body;

    // 🔐 Auth + Role
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can add attendance",
      });
    }

    // ✅ Validation
    if (
      !labourId ||
      !projectId ||
      !attendanceType ||
      !selfieImage ||
      !coordinates
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!["check-in", "check-out"].includes(attendanceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance type",
      });
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be [longitude, latitude]",
      });
    }

    // 🔍 Find attendance document
    let attendanceDoc = await Attendance.findOne({
      user: labourId,
      project: projectId,
    });

    if (!attendanceDoc) {
      attendanceDoc = await Attendance.create({
        user: labourId,
        project: projectId,
        history: [],
      });
    }

    // 🔎 Last entry
    const lastEntry = attendanceDoc.history[attendanceDoc.history.length - 1];

    // 🧠 AUTO-FIX LOGIC (ADMIN OVERRIDE)
    if (
      attendanceType === "check-in" &&
      lastEntry?.attendanceType === "check-in"
    ) {
      // Auto checkout previous session
      attendanceDoc.history.push({
        attendanceType: "check-out",
        selfieImage: "admin-auto-checkout",
        location: lastEntry.location,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        editedByAdmin: true,
        editedAt: new Date(),
      });
    }

    // ✅ PUSH ADMIN ENTRY
    attendanceDoc.history.push({
      attendanceType,
      selfieImage,
      location: {
        type: "Point",
        coordinates,
      },
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      editedByAdmin: true,
      editedAt: new Date(),
    });

    await attendanceDoc.save();

    return res.status(201).json({
      success: true,
      message: "Attendance added by admin successfully",
      history: attendanceDoc.history,
    });
  } catch (error) {
    console.error("Admin Add Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { attendanceId, historyIndex } = req.body;

    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can delete attendance records",
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Not found" });
    }

    if (
      !attendance.history ||
      historyIndex < 0 ||
      historyIndex >= attendance.history.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid history index",
      });
    }

    // 🗑️ DELETE ENTRY
    attendance.history.splice(historyIndex, 1);
    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    console.error("Delete Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
