import Attendance from "../models/Attendance.js";
import Project from "../models/Project.js";
import { getDistanceInMeters } from "../helpers/geoDistance.js";

export const submitAttendance = async (req, res) => {
  try {
    const { projectId, attendanceType, selfieImage, coordinates } = req.body;

    // 🔒 Labour only
    if (req.user.role !== "labour") {
      return res
        .status(403)
        .json({ message: "Only labour can mark attendance" });
    }

    if (!projectId || !attendanceType || !selfieImage || !coordinates) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: "Invalid coordinates format" });
    }

    const project = await Project.findById(projectId);

    if (!project || !project.location?.coordinates?.coordinates) {
      return res
        .status(400)
        .json({ message: "Project location not configured" });
    }

    // Project coordinates
    const [projectLng, projectLat] = project.location.coordinates.coordinates;

    // Labour coordinates
    const [userLng, userLat] = coordinates;

    // 📏 Distance check (10 meters)
    const distance = getDistanceInMeters(
      projectLat,
      projectLng,
      userLat,
      userLng,
    );

    if (distance > 10) {
      return res.status(403).json({
        message: "Attendance allowed only within 10 meters of site",
        distance: `${distance.toFixed(2)} meters`,
      });
    }

    // 🧾 Save attendance
    const attendance = await Attendance.create({
      user: req.user._id,
      project: projectId,
      attendanceType,
      selfieImage,
      location: {
        type: "Point",
        coordinates,
      },
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Attendance already marked" });
    }

    res.status(500).json({ message: error.message });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ user: req.user._id })
      .populate("project", "projectName siteName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, attendance });
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

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
