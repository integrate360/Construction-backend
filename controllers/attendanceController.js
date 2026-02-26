import Attendance from "../models/Attendance.js";
import Project from "../models/Project.js";
import { getDistanceInMeters } from "../helpers/geoDistance.js";
import { calculateTotalWorkingTime } from "../helpers/attendanceUtils.js";
import { getDateRangeUTC } from "../helpers/dateUtils.js";
import User from "../models/User.js";

export const submitAttendance = async (req, res) => {
  try {
    console.log("📝 [ATTENDANCE] Starting attendance submission...");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    console.log(
      "👤 User:",
      req.user
        ? {
            id: req.user._id,
            role: req.user.role,
            name: req.user.name,
          }
        : "No user found",
    );

    const { projectId, attendanceType, selfieImage, coordinates } = req.body;

    // 🔐 Auth
    if (!req.user) {
      console.log("❌ [ATTENDANCE] Unauthorized: No user in request");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("🔐 [ATTENDANCE] Checking user role...");
    if (req.user.role !== "labour") {
      console.log(
        `❌ [ATTENDANCE] Invalid role: ${req.user.role}. Expected: labour`,
      );
      return res.status(403).json({
        success: false,
        message: "Only labour can mark attendance",
      });
    }
    console.log("✅ [ATTENDANCE] User role verified: labour");

    // 📋 Validate required fields
    console.log("📋 [ATTENDANCE] Validating required fields...");
    const missingFields = [];
    if (!projectId) missingFields.push("projectId");
    if (!attendanceType) missingFields.push("attendanceType");
    if (!selfieImage) missingFields.push("selfieImage");
    if (!coordinates) missingFields.push("coordinates");

    if (missingFields.length > 0) {
      console.log("❌ [ATTENDANCE] Missing fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields,
      });
    }
    console.log("✅ [ATTENDANCE] All required fields present");

    // 📍 Validate coordinates
    console.log("📍 [ATTENDANCE] Validating coordinates:", coordinates);
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      console.log(
        "❌ [ATTENDANCE] Invalid coordinates format. Expected [longitude, latitude], got:",
        coordinates,
      );
      return res.status(400).json({
        success: false,
        message: "Coordinates must be [longitude, latitude]",
      });
    }
    console.log("✅ [ATTENDANCE] Coordinates format valid");
    console.log(
      `📍 User location - Longitude: ${coordinates[0]}, Latitude: ${coordinates[1]}`,
    );

    // 🔍 Find Project
    console.log(`🔍 [ATTENDANCE] Looking for project with ID: ${projectId}`);
    const project = await Project.findById(projectId);

    if (!project) {
      console.log("❌ [ATTENDANCE] Project not found with ID:", projectId);
      return res.status(400).json({
        success: false,
        message: "Project not found",
      });
    }
    console.log("✅ [ATTENDANCE] Project found:", {
      id: project._id,
      name: project.projectName,
      siteName: project.siteName,
    });

    // Check project location
    console.log("📍 [ATTENDANCE] Checking project location configuration...");
    if (!project.location?.coordinates?.coordinates) {
      console.log(
        "❌ [ATTENDANCE] Project location not configured. Location data:",
        project.location,
      );
      return res.status(400).json({
        success: false,
        message: "Project location not configured",
      });
    }
    console.log("✅ [ATTENDANCE] Project location configured");

    // 📏 Distance calculation
    const [projectLng, projectLat] = project.location.coordinates.coordinates;
    const [userLng, userLat] = coordinates;

    console.log("📍 [ATTENDANCE] Project coordinates:", {
      longitude: projectLng,
      latitude: projectLat,
    });
    console.log("📍 [ATTENDANCE] User coordinates:", {
      longitude: userLng,
      latitude: userLat,
    });

    console.log("📏 [ATTENDANCE] Calculating distance...");
    const distance = getDistanceInMeters(
      projectLat,
      projectLng,
      userLat,
      userLng,
    );

    console.log(
      `📏 [ATTENDANCE] Calculated distance: ${distance.toFixed(2)} meters`,
    );

    if (distance > 10) {
      console.log(
        `❌ [ATTENDANCE] Distance exceeded limit: ${distance.toFixed(2)}m > 10m`,
      );

      // Create a user-friendly message with the distance
      const distanceMessage = `You are not on site. You are ${distance.toFixed(2)} meters away from the project location. Maximum allowed distance is 10 meters.`;

      return res.status(403).json({
        success: false,
        message: distanceMessage,
        data: {
          distance: distance.toFixed(2),
          maxAllowed: 10,
          isWithinRange: false,
        },
      });
    }
    console.log("✅ [ATTENDANCE] Distance within limit (≤ 10m)");

    // 🔍 Find attendance document
    console.log(
      `🔍 [ATTENDANCE] Looking for attendance document - User: ${req.user._id}, Project: ${projectId}`,
    );
    let attendanceDoc = await Attendance.findOne({
      user: req.user._id,
      project: projectId,
    });

    if (!attendanceDoc) {
      console.log(
        "🆕 [ATTENDANCE] No existing attendance found. Creating new document...",
      );
      attendanceDoc = await Attendance.create({
        user: req.user._id,
        project: projectId,
        history: [],
      });
      console.log(
        "✅ [ATTENDANCE] New attendance document created with ID:",
        attendanceDoc._id,
      );
    } else {
      console.log(
        "✅ [ATTENDANCE] Existing attendance document found. ID:",
        attendanceDoc._id,
      );
      console.log(
        `📊 [ATTENDANCE] Current history entries: ${attendanceDoc.history.length}`,
      );
    }

    // 🔎 Check last history entry
    const lastEntry = attendanceDoc.history[attendanceDoc.history.length - 1];
    console.log(
      "📜 [ATTENDANCE] Last history entry:",
      lastEntry
        ? {
            type: lastEntry.attendanceType,
            time: lastEntry.timestamp,
            location: lastEntry.location?.coordinates,
          }
        : "No previous entries",
    );

    // 🚫 Validation rules
    console.log("🚫 [ATTENDANCE] Validating attendance rules...");
    console.log(`Current action: ${attendanceType}`);

    if (
      attendanceType === "check-in" &&
      lastEntry?.attendanceType === "check-in"
    ) {
      console.log("❌ [ATTENDANCE] Invalid: Already checked in");
      return res.status(400).json({
        success: false,
        message: "Already checked in. Please check out first.",
      });
    }

    if (
      attendanceType === "check-out" &&
      (!lastEntry || lastEntry.attendanceType !== "check-in")
    ) {
      console.log(
        "❌ [ATTENDANCE] Invalid: Cannot check out without checking in first",
      );
      return res.status(400).json({
        success: false,
        message: "You must check in before checking out.",
      });
    }

    console.log("✅ [ATTENDANCE] Attendance rules validation passed");

    // ✅ Push to history
    console.log("💾 [ATTENDANCE] Saving attendance record...");
    const newEntry = {
      attendanceType,
      selfieImage,
      location: {
        type: "Point",
        coordinates,
      },
    };

    console.log("📝 [ATTENDANCE] New entry:", {
      ...newEntry,
      selfieImage: "[BASE64_IMAGE_TRUNCATED]",
    });

    attendanceDoc.history.push(newEntry);
    await attendanceDoc.save();

    console.log("✅ [ATTENDANCE] Attendance saved successfully!");
    console.log(
      `📊 [ATTENDANCE] Total history entries now: ${attendanceDoc.history.length}`,
    );
    console.log(`🕒 [ATTENDANCE] Timestamp: ${new Date().toISOString()}`);

    return res.status(201).json({
      success: true,
      message: "Attendance saved successfully",
      data: {
        history: attendanceDoc.history,
        distance: distance.toFixed(2),
        isWithinRange: true,
      },
    });
  } catch (error) {
    console.error("🔥 [ATTENDANCE] Error:", error);
    console.error("📋 [ATTENDANCE] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while submitting attendance",
    });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id; // Your user ID

    const myAttendanceRecords = await Attendance.find({
      user: userId,
    }).populate("project", "projectName siteName");

    // Get all projects you're associated with
    const myProjectIds = myAttendanceRecords.map((record) =>
      record.project._id.toString(),
    );

    // Get ALL attendance records from your projects (all users)
    const allAttendanceRecords = await Attendance.find({
      project: { $in: myProjectIds },
    }).populate("project", "projectName siteName");

    const activeDatesSet = new Set();

    allAttendanceRecords.forEach((record) => {
      record.history.forEach((entry) => {
        const entryDate = new Date(entry.createdAt);
        const dateStr = entryDate.toISOString().split("T")[0];
        activeDatesSet.add(dateStr);
      });
    });

    // Convert to sorted array
    const activeDates = Array.from(activeDatesSet).sort();

    /* ===============================
       CREATE A MAP OF YOUR ATTENDANCE BY DATE
    =============================== */
    const myAttendanceByDate = {};

    // Process your attendance records
    myAttendanceRecords.forEach((record) => {
      // Group by date
      record.history.forEach((entry) => {
        const entryDate = new Date(entry.createdAt);
        const dateStr = entryDate.toISOString().split("T")[0];

        // Only process if this date is in active dates
        if (activeDatesSet.has(dateStr)) {
          if (!myAttendanceByDate[dateStr]) {
            myAttendanceByDate[dateStr] = {
              _id: record._id,
              user: record.user,
              project: record.project,
              status: "present",
              history: [],
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
              __v: record.__v,
            };
          }
          myAttendanceByDate[dateStr].history.push(entry);
        }
      });
    });

    /* ===============================
       BUILD FINAL RESPONSE - ONLY ACTIVE DATES
    =============================== */
    const finalAttendance = {};

    // For each active date, add your attendance data or mark as absent
    activeDates.forEach((dateStr) => {
      if (myAttendanceByDate[dateStr]) {
        // You were present on this date
        const record = myAttendanceByDate[dateStr];

        // Sort history
        record.history.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );

        // Calculate working time
        const { totalMinutes, totalHours } = calculateTotalWorkingTime(
          record.history,
        );
        record.totalWorkingMinutes = totalMinutes;
        record.totalWorkingHours = totalHours;

        finalAttendance[dateStr] = [record];
      } else {
        // You were absent on this date (but others were present)
        finalAttendance[dateStr] = [
          {
            status: "absent",
            message: "Other users checked in on this date, but you were absent",
            date: dateStr,
          },
        ];
      }
    });

    // Sort dates in descending order (newest first)
    const sortedFinalAttendance = {};
    Object.keys(finalAttendance)
      .sort((a, b) => new Date(b) - new Date(a))
      .forEach((date) => {
        sortedFinalAttendance[date] = finalAttendance[date];
      });

    /* ===============================
       CALCULATE STATISTICS
    =============================== */
    let totalWorkingMinutes = 0;
    let presentDays = 0;
    let absentDays = 0;

    Object.keys(sortedFinalAttendance).forEach((date) => {
      const record = sortedFinalAttendance[date][0];
      if (record.status === "present") {
        presentDays++;
        totalWorkingMinutes += record.totalWorkingMinutes || 0;
      } else {
        absentDays++;
      }
    });

    /* ===============================
       FINAL RESPONSE
    =============================== */
    return res.status(200).json({
      success: true,
      attendance: sortedFinalAttendance,
      summary: {
        totalActiveDays: activeDates.length,
        presentDays,
        absentDays,
        totalWorkingMinutes,
        totalWorkingHours: Math.round((totalWorkingMinutes / 60) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("🔥 Get My Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectAttendance = async (req, res) => {
  try {
    const { date, from, to, userId } = req.query;
    const { projectId } = req.params;

    /* ===============================
       GET PROJECT
    =============================== */
    const project = await Project.findById(projectId).select(
      "site_manager labour",
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    let userIds = [project.site_manager, ...(project.labour || [])].filter(
      Boolean,
    );

    /* ===============================
       USER FILTER
    =============================== */
    if (userId) {
      if (!userIds.map(String).includes(userId)) {
        return res.status(400).json({
          success: false,
          message: "User does not belong to this project",
        });
      }
      userIds = [userId];
    }

    /* ===============================
       GET USERS
    =============================== */
    const users = await User.find({
      _id: { $in: userIds },
    }).select("name phoneNumber");

    /* ===============================
       GET ATTENDANCE RECORDS
    =============================== */
    const attendanceDocs = await Attendance.find({
      project: projectId,
      user: { $in: userIds },
    }).populate("user", "name phoneNumber");

    /* ===============================
       DATE RANGE LOGIC
    =============================== */
    let startDate, endDate;

    if (date) {
      startDate = new Date(`${date}T00:00:00.000Z`);
      endDate = new Date(`${date}T23:59:59.999Z`);
    } else if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > 90) {
        return res.status(400).json({
          success: false,
          message:
            "Date range cannot exceed 90 days. Please use a smaller range.",
        });
      }

      startDate = new Date(`${from}T00:00:00.000Z`);
      endDate = new Date(`${to}T23:59:59.999Z`);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    /* ===============================
       CREATE ATTENDANCE MAP FOR ALL USERS
    =============================== */
    const attendanceByUser = {};
    attendanceDocs.forEach((doc) => {
      attendanceByUser[doc.user._id.toString()] = doc;
    });

    /* ===============================
       COLLECT ALL DATES THAT HAVE ATTENDANCE
    =============================== */
    const attendanceDatesSet = new Set();

    // Collect all unique dates from history within the range
    attendanceDocs.forEach((doc) => {
      doc.history.forEach((entry) => {
        const entryDate = new Date(entry.createdAt);
        if (entryDate >= startDate && entryDate <= endDate) {
          const dateStr = entryDate.toISOString().split("T")[0];
          attendanceDatesSet.add(dateStr);
        }
      });
    });

    // Convert set to sorted array of dates that have attendance
    const activeDates = Array.from(attendanceDatesSet).sort();

    console.log("📅 Active Dates (with attendance):", activeDates);

    /* ===============================
       CREATE RESPONSE WITH YOUR ORIGINAL FORMAT
       But only include dates that have attendance
    =============================== */
    const attendanceRecords = [];

    // Process each user
    for (const user of users) {
      const userId = user._id.toString();
      const attendanceDoc = attendanceByUser[userId];

      // Initialize days array with ONLY active dates (dates that have attendance)
      const days = activeDates.map((date) => ({
        date,
        status: "absent", // Default to absent
        history: [],
        totalWorkingMinutes: 0,
        totalWorkingHours: 0,
      }));

      // If user has attendance records, update the present days
      if (attendanceDoc) {
        const attendanceId = attendanceDoc._id;

        // Process each active date
        for (let i = 0; i < days.length; i++) {
          const dateStr = days[i].date;
          const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
          const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

          // Get history for this specific date
          const dayHistory = attendanceDoc.history.filter((h) => {
            const hDate = new Date(h.createdAt);
            return hDate >= dayStart && hDate <= dayEnd;
          });

          if (dayHistory.length > 0) {
            // Sort history entries
            dayHistory.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            );

            // Calculate working time
            const { totalMinutes, totalHours } =
              calculateTotalWorkingTime(dayHistory);

            days[i].status = "present";
            days[i].history = dayHistory;
            days[i].totalWorkingMinutes = totalMinutes;
            days[i].totalWorkingHours = totalHours;
          }
        }

        // Add attendance record with ID for users who have attendance documents
        attendanceRecords.push({
          _id: attendanceId,
          user: {
            _id: user._id,
            name: user.name,
            phoneNumber: user.phoneNumber,
          },
          project: projectId,
          days: days,
          hasAttendance: true,
        });
      } else {
        // For users without any attendance records, create a record with all days absent
        attendanceRecords.push({
          _id: null,
          user: {
            _id: user._id,
            name: user.name,
            phoneNumber: user.phoneNumber,
          },
          project: projectId,
          days: days, // All active dates marked as absent
          hasAttendance: false,
        });
      }
    }

    /* ===============================
       FINAL RESPONSE - YOUR ORIGINAL FORMAT
    =============================== */
    return res.status(200).json({
      success: true,
      attendance: attendanceRecords,
      totalRecords: attendanceRecords.length,
      totalDays: activeDates.length, // Now this is only days with attendance
      dateRange: {
        from: startDate.toISOString().split("T")[0],
        to: endDate.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("🔥 Get Project Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
    const { date } = req.query;
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
    const { month, year } = req.query;
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
    console.log("🔵 Admin Edit Attendance API called");
    console.log("➡️ Request Body:", req.body);

    const { attendanceId, historyId, attendanceType, createdAt } = req.body;

    /* ===============================
       SUPER ADMIN CHECK
    =============================== */
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can edit attendance",
      });
    }

    /* ===============================
       BASIC VALIDATION
    =============================== */
    if (!attendanceId || !historyId) {
      return res.status(400).json({
        success: false,
        message: "attendanceId and historyId are required",
      });
    }

    if (attendanceType && !["check-in", "check-out"].includes(attendanceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance type",
      });
    }

    if (createdAt && isNaN(new Date(createdAt).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid createdAt date",
      });
    }

    /* ===============================
       FIND ATTENDANCE DOC
    =============================== */
    const attendance = await Attendance.findById(attendanceId)
      .populate("project")
      .populate("user");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    /* ===============================
       FIND HISTORY BY _id (ONLY)
    =============================== */
    const historyEntry = attendance.history.id(String(historyId));

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: "History entry not found",
      });
    }

    /* ===============================
       APPLY EDITS
    =============================== */
    if (attendanceType) {
      historyEntry.attendanceType = attendanceType;
    }

    if (createdAt) {
      historyEntry.createdAt = new Date(createdAt);
    }

    historyEntry.editedByAdmin = true;
    historyEntry.editedAt = new Date();

    await attendance.save();

    /* ===============================
       FINAL RESPONSE
    =============================== */
    return res.status(200).json({
      success: true,
      message: "Attendance history updated successfully",
      updatedHistory: historyEntry,
      fullHistory: attendance.history,
    });
  } catch (err) {
    console.error("🔥 Admin Edit Attendance Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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

export const adminAddAttendanceForUser = async (req, res) => {
  try {
    console.log("🔵 Admin Add Attendance API called");

    const { userId, projectId, attendanceType, coordinates, createdAt } =
      req.body;

    console.log("➡️ Request Body:", req.body);
    console.log("➡️ Logged-in User:", {
      id: req.user?._id,
      role: req.user?.role,
    });

    /* ===============================
       AUTH
    =============================== */
    if (!req.user || req.user.role !== "super_admin") {
      console.log("❌ Unauthorized access");
      return res.status(403).json({
        success: false,
        message: "Only super admin can add attendance",
      });
    }

    /* ===============================
       BASIC VALIDATION
    =============================== */
    if (!userId || !projectId || !attendanceType || !coordinates) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message:
          "userId, projectId, attendanceType and coordinates are required",
      });
    }

    if (!["check-in", "check-out"].includes(attendanceType)) {
      console.log("❌ Invalid attendanceType:", attendanceType);
      return res.status(400).json({
        success: false,
        message: "attendanceType must be check-in or check-out",
      });
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      console.log("❌ Invalid coordinates:", coordinates);
      return res.status(400).json({
        success: false,
        message: "coordinates must be [longitude, latitude]",
      });
    }

    /* ===============================
       FIND PROJECT (FIXED)
    =============================== */
    console.log("🔍 Finding project by projectId:", projectId);

    const project = await Project.findById(projectId);

    console.log("📦 Project found:", project);

    if (!project) {
      console.log("❌ Project not found");
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /* ===============================
       VALIDATE USER IN PROJECT
    =============================== */
    const isUserInProject =
      project.site_manager?.toString() === userId ||
      project.labour?.map(String).includes(userId);

    console.log("👤 Is user in project:", isUserInProject);

    if (!isUserInProject) {
      console.log("❌ User not part of project");
      return res.status(400).json({
        success: false,
        message: "User does not belong to this project",
      });
    }

    /* ===============================
       FIND / CREATE ATTENDANCE DOC
    =============================== */
    let attendanceDoc = await Attendance.findOne({
      user: userId,
      project: project._id,
    });

    console.log(
      "📘 Existing attendance doc:",
      attendanceDoc ? "FOUND" : "NOT FOUND",
    );

    if (!attendanceDoc) {
      attendanceDoc = await Attendance.create({
        user: userId,
        project: project._id,
        history: [],
      });
      console.log("📘 New attendance document created");
    }

    /* ===============================
       DATE & TIME LOGIC
    =============================== */
    const entryDate = createdAt ? new Date(createdAt) : new Date();

    const dayStart = new Date(entryDate);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(entryDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    console.log("🕒 Entry Date:", entryDate.toISOString());
    console.log("📅 Day Start:", dayStart.toISOString());
    console.log("📅 Day End:", dayEnd.toISOString());

    const dayHistory = attendanceDoc.history
      .filter((h) => {
        const t = new Date(h.createdAt);
        return t >= dayStart && t <= dayEnd;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    console.log("📜 Day history count:", dayHistory.length);

    const lastEntryOfDay = dayHistory[dayHistory.length - 1];

    /* ===============================
       VALIDATIONS
    =============================== */

    // ⏱ time must move forward
    if (lastEntryOfDay) {
      const lastTime = new Date(lastEntryOfDay.createdAt);
      if (entryDate <= lastTime) {
        console.log("❌ Time is earlier than last entry");
        return res.status(400).json({
          success: false,
          message:
            "Attendance time must be later than the previous entry for this date",
        });
      }
    }

    // 🔁 same type twice
    if (lastEntryOfDay && lastEntryOfDay.attendanceType === attendanceType) {
      console.log("❌ Same attendance type twice");
      return res.status(400).json({
        success: false,
        message: `Cannot add ${attendanceType} twice in a row for the same date`,
      });
    }

    // ❌ checkout without checkin
    if (!lastEntryOfDay && attendanceType === "check-out") {
      console.log("❌ Checkout without check-in");
      return res.status(400).json({
        success: false,
        message: "Cannot check-out without a check-in for this date",
      });
    }

    /* ===============================
       PUSH ENTRY
    =============================== */
    const newEntry = {
      attendanceType,
      selfieImage: "admin-entry",
      location: {
        type: "Point",
        coordinates,
      },
      createdAt: entryDate,
      editedByAdmin: true,
      editedAt: new Date(),
    };

    attendanceDoc.history.push(newEntry);
    await attendanceDoc.save();

    console.log("✅ Attendance added successfully");

    return res.status(201).json({
      success: true,
      message: "Attendance added successfully by admin",
      project: {
        id: project._id,
        name: project.projectName,
      },
      addedEntry: newEntry,
      fullHistory: attendanceDoc.history,
    });
  } catch (error) {
    console.error("🔥 Admin Add Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { attendanceId, historyIndex } = req.body; // Now using historyIndex instead of index

    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can delete attendance records",
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Find the history entry by its _id using Mongoose's .id() method
    const historyEntry = attendance.history.id(historyIndex);

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: "History entry not found",
      });
    }

    // Remove the entry using pull
    attendance.history.pull({ _id: historyIndex });
    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
      deletedEntry: historyEntry,
    });
  } catch (error) {
    console.error("Delete Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectAttendanceAdmin = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date, viewMode = "daily" } = req.query;

    let startDate = null;
    let endDate = null;

    // ----------------------------
    // DATE RANGE LOGIC
    // ----------------------------
    if (date) {
      const selectedDate = new Date(date);

      if (viewMode === "daily") {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      }

      if (viewMode === "weekly") {
        const day = selectedDate.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;

        startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }

      if (viewMode === "monthly") {
        startDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        );
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
        );
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // ----------------------------
    // ❗ FIX: ALWAYS FETCH FULL HISTORY
    // ----------------------------
    const attendance = await Attendance.find({ project: projectId })
      .populate("user", "name phoneNumber")
      .sort({ createdAt: -1 });

    // ----------------------------
    // GROUP BY USER
    // ----------------------------
    const projectAttendance = {};

    attendance.forEach((record) => {
      const userId = record.user._id.toString();

      if (!projectAttendance[userId]) {
        projectAttendance[userId] = {
          user: record.user,
          attendance: [], // all attendance documents
          fullHistory: [], // all history events
        };
      }

      // Add full history (all time)
      if (record.history) {
        record.history.forEach((h) =>
          projectAttendance[userId].fullHistory.push(h),
        );
      }

      // Store full attendance record
      projectAttendance[userId].attendance.push({
        ...record.toObject(),
        history: record.history, // unfiltered
      });
    });

    // ----------------------------
    // COMPUTE WORKING TIME + SUMMARY
    // ----------------------------
    Object.keys(projectAttendance).forEach((userId) => {
      const userData = projectAttendance[userId];

      // Sort full history
      const fullHistory = [...userData.fullHistory].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );

      // ----------------------------
      // FILTERED HISTORY FOR RANGE (FIX)
      // ----------------------------
      const rangeHistory = fullHistory.filter((h) => {
        if (!startDate || !endDate) return true;
        const d = new Date(h.createdAt);
        return d >= startDate && d <= endDate;
      });

      // ----------------------------
      // WORKING TIME (FILTERED RANGE)
      // ----------------------------
      let totalMinutes = 0;
      let lastCheckIn = null;

      rangeHistory.forEach((record) => {
        if (record.attendanceType === "check-in") {
          if (!lastCheckIn) lastCheckIn = record;
        } else if (record.attendanceType === "check-out" && lastCheckIn) {
          const diff =
            new Date(record.createdAt) - new Date(lastCheckIn.createdAt);
          const mins = Math.floor(diff / (1000 * 60));

          if (mins > 0 && mins < 960) totalMinutes += mins;

          lastCheckIn = null;
        }
      });

      userData.workingTime = {
        totalMinutes,
        totalHours: Number((totalMinutes / 60).toFixed(2)),
        formatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      };

      // ----------------------------
      // DAILY WORKING TIME (ALL TIME)
      // ----------------------------
      const historyPerDay = {};

      fullHistory.forEach((h) => {
        const d = new Date(h.createdAt).toISOString().split("T")[0];
        if (!historyPerDay[d]) historyPerDay[d] = [];
        historyPerDay[d].push(h);
      });

      const dailyWorkingTime = {};

      Object.keys(historyPerDay).forEach((d) => {
        const dayRecs = historyPerDay[d].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );

        let mins = 0;
        let dayIn = null;

        dayRecs.forEach((r) => {
          if (r.attendanceType === "check-in") {
            if (!dayIn) dayIn = r;
          } else if (r.attendanceType === "check-out" && dayIn) {
            const diff = new Date(r.createdAt) - new Date(dayIn.createdAt);
            const m = Math.floor(diff / (1000 * 60));
            if (m >= 1 && m < 960) mins += m;
            dayIn = null;
          }
        });

        dailyWorkingTime[d] = {
          totalMinutes: mins,
          totalHours: Number((mins / 60).toFixed(2)),
          formatted: `${Math.floor(mins / 60)}h ${mins % 60}m`,
        };
      });

      // ----------------------------
      // SUMMARY
      // ----------------------------
      const uniqueDates = Object.keys(historyPerDay);

      userData.attendanceSummary = {
        presentDaysCount: uniqueDates.length,
        presentDates: uniqueDates,
        dailyWorkingTime,
      };
    });

    return res.status(200).json({
      success: true,
      attendance: projectAttendance,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const projects = await Project.find({
      $or: [
        { client: userId },
        { site_manager: userId },
        { labour: userId },
        { createdBy: userId },
      ],
    }).select("_id projectName siteName");
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message,
    });
  }
};
