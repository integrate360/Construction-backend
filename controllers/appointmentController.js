import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
  try {
    const {
      title,
      location,
      meetingTime,
      reminderTime,
      notes,
      project,
      attendees,
    } = req.body;

    // Validate meeting time is in the future
    if (new Date(meetingTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Meeting time must be in the future",
      });
    }

    const appointment = await Appointment.create({
      title,
      location,
      meetingTime,
      reminderTime,
      notes,
      project,
      attendees: attendees || [], // Store as array of strings (names)
      createdBy: req.user._id,
    });

    // Populate only the project and createdBy (User references)
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("project", "name description")
      .populate("createdBy", "name email profilePic");

    res.status(201).json({
      success: true,
      data: populatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      project,
      startDate,
      endDate,
      search,
      attendee, // Search by attendee name
      sortBy = "meetingTime",
      sortOrder = "asc",
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by project
    if (project) {
      filter.project = project;
    }

    // Filter by attendee name
    if (attendee) {
      filter.attendees = { $in: [new RegExp(attendee, "i")] };
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.meetingTime = {};
      if (startDate) filter.meetingTime.$gte = new Date(startDate);
      if (endDate) filter.meetingTime.$lte = new Date(endDate);
    }

    // Search in title, notes, location, and attendees
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { attendees: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // If user is not admin, show only appointments they created
    // Note: Since attendees are strings (names), we can't filter by user ID
    if (req.user.role !== "admin") {
      filter.createdBy = req.user._id;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query - only populate project and createdBy (User references)
    const appointments = await Appointment.find(filter)
      .populate("project", "name description color")
      .populate("createdBy", "name email profilePic role")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("project", "name description color members")
      .populate("createdBy", "name email profilePic role");

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if user has access to this appointment (only creator can view)
    // Since attendees are strings (names), we can't check by user ID
    if (
      req.user.role !== "admin" &&
      appointment.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this appointment",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const {
      title,
      location,
      meetingTime,
      reminderTime,
      notes,
      project,
      attendees,
      status,
    } = req.body;

    let appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if user has permission to update (createdBy only, or admin)
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can update this appointment",
      });
    }

    // Validate meeting time if being updated
    if (meetingTime && new Date(meetingTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Meeting time must be in the future",
      });
    }

    // Update appointment
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        title,
        location,
        meetingTime,
        reminderTime,
        notes,
        project,
        attendees,
        status,
      },
      { new: true, runValidators: true },
    )
      .populate("project", "name description")
      .populate("createdBy", "name email profilePic");

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { meetingTime, reminderTime } = req.body;

    if (!meetingTime) {
      return res.status(400).json({
        success: false,
        message: "New meeting time is required",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check permission
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can reschedule this appointment",
      });
    }

    // Check if appointment can be rescheduled (not completed/cancelled)
    if (
      appointment.status === "completed" ||
      appointment.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule ${appointment.status} appointment`,
      });
    }

    // Validate new meeting time
    if (new Date(meetingTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "New meeting time must be in the future",
      });
    }

    appointment.meetingTime = meetingTime;
    if (reminderTime) appointment.reminderTime = reminderTime;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate("project", "name description")
      .populate("createdBy", "name email profilePic");

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check permission (only creator or admin can cancel)
    // Since attendees are strings, we can't check if current user is an attendee by ID
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can cancel this appointment",
      });
    }

    // Check if already completed/cancelled
    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed appointment",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check permission (only creator or admin)
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can mark appointment as completed",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot complete cancelled appointment",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already completed",
      });
    }

    appointment.status = "completed";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment marked as completed",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check permission (only creator or admin)
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can delete this appointment",
      });
    }

    // Soft delete
    appointment.isActive = false;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUpcomingAppointments = async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    // Since attendees are strings, we can only filter by createdBy
    const appointments = await Appointment.find({
      $and: [
        { isActive: true },
        { status: "scheduled" },
        { meetingTime: { $gte: new Date(), $lte: endDate } },
        { createdBy: req.user._id }, // Only show appointments created by the user
      ],
    })
      .populate("project", "name")
      .populate("createdBy", "name email")
      .sort({ meetingTime: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAppointmentStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Appointment.aggregate([
      {
        $match: {
          isActive: true,
          createdBy: userId, // Only count appointments created by the user
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get counts for next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingCount = await Appointment.countDocuments({
      isActive: true,
      status: "scheduled",
      meetingTime: { $gte: today, $lte: nextWeek },
      createdBy: userId,
    });

    // Format stats
    const formattedStats = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      upcoming: upcomingCount,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addAttendee = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Attendee name is required",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check permission
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can add attendees",
      });
    }

    // Check if attendee is already in the list
    if (appointment.attendees.includes(name)) {
      return res.status(400).json({
        success: false,
        message: "Attendee is already in the list",
      });
    }

    appointment.attendees.push(name);
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Attendee added successfully",
      data: {
        attendees: appointment.attendees,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeAttendee = async (req, res) => {
  try {
    const { name } = req.params;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check permission
    if (
      req.user.role !== "admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can remove attendees",
      });
    }

    // Remove the attendee
    appointment.attendees = appointment.attendees.filter(
      (attendeeName) =>
        attendeeName.toLowerCase() !== decodeURIComponent(name).toLowerCase(),
    );
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Attendee removed successfully",
      data: {
        attendees: appointment.attendees,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
