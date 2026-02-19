import Appointment from "../models/Appointment.js";

// In createAppointment
export const createAppointment = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      startTime,
      reminderTime,
      notes,
      project,
      attendees,
    } = req.body;

    const now = new Date();

    if (new Date(startTime) < now) {
      return res.status(400).json({
        success: false,
        message: "Start time must be in the future",
      });
    }

    if (reminderTime && new Date(reminderTime) >= new Date(startTime)) {
      return res.status(400).json({
        success: false,
        message: "Reminder time must be before start time",
      });
    }

    // Check for conflicting appointments at the same start time
    const conflict = await Appointment.findOne({
      isActive: true,
      status: { $in: ["scheduled", "rescheduled"] },
      createdBy: req.user._id,
      startTime: new Date(startTime),
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Time slot conflicts with an existing appointment",
      });
    }

    const appointment = await Appointment.create({
      title,
      description,
      location,
      startTime,
      reminderTime,
      notes,
      project,
      attendees: attendees || [],
      createdBy: req.user._id,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("project", "name description color")
      .populate("createdBy", "name email profilePic");

    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: "Appointment created successfully",
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
      attendee,
      sortBy = "startTime",
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
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
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

    // If user is not super_admin, show only appointments they created
    if (req.user.role !== "super_admin") {
      filter.createdBy = req.user._id;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
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

    // Check if user has access to this appointment
    if (
      req.user.role !== "super_admin" &&
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
      description,
      location,
      startTime,
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

    // Permission check
    if (
      req.user.role !== "super_admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can update this appointment",
      });
    }

    // Time validation
    const newStartTime = startTime
      ? new Date(startTime)
      : appointment.startTime;

    if (newStartTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Start time must be in the future",
      });
    }

    if (reminderTime && new Date(reminderTime) >= newStartTime) {
      return res.status(400).json({
        success: false,
        message: "Reminder time must be before start time",
      });
    }

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(location && { location }),
      ...(startTime && { startTime }),
      ...(reminderTime && { reminderTime }),
      ...(notes && { notes }),
      ...(project && { project }),
      ...(attendees && { attendees }),
      ...(status && { status }),
    };

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate("project", "name description color")
      .populate("createdBy", "name email profilePic");

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Appointment updated successfully",
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
    const { startTime, reminderTime } = req.body;

    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: "New start time is required",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Permission check
    if (
      req.user.role !== "super_admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can reschedule this appointment",
      });
    }

    // Cannot reschedule completed or cancelled
    if (["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule ${appointment.status} appointment`,
      });
    }

    const newStartTime = new Date(startTime);

    if (newStartTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: "New start time must be in the future",
      });
    }

    appointment.startTime = newStartTime;

    if (reminderTime) {
      if (new Date(reminderTime) >= newStartTime) {
        return res.status(400).json({
          success: false,
          message: "Reminder time must be before start time",
        });
      }
      appointment.reminderTime = reminderTime;
    }

    appointment.status = "rescheduled";

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate("project", "name description")
      .populate("createdBy", "name email");

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

    // Check permission
    if (
      req.user.role !== "super_admin" &&
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

    // Check permission
    if (
      req.user.role !== "super_admin" &&
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

    // Check permission
    if (
      req.user.role !== "super_admin" &&
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

    const filter = {
      isActive: true,
      status: "scheduled",
      startTime: { $gte: new Date(), $lte: endDate },
    };

    // If user is not super_admin, show only their appointments
    if (req.user.role !== "super_admin") {
      filter.createdBy = req.user._id;
    }

    const appointments = await Appointment.find(filter)
      .populate("project", "name")
      .populate("createdBy", "name email")
      .sort({ startTime: 1 })
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
          createdBy: userId,
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
      startTime: { $gte: today, $lte: nextWeek },
      createdBy: userId,
    });

    // Format stats
    const formattedStats = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
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
      req.user.role !== "super_admin" &&
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
    const { attendee } = req.params;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || !appointment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Permission check
    if (
      req.user.role !== "super_admin" &&
      appointment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can remove attendees",
      });
    }

    const decodedAttendee = decodeURIComponent(attendee).toLowerCase();

    const originalLength = appointment.attendees.length;

    appointment.attendees = appointment.attendees.filter(
      (a) => a.toLowerCase() !== decodedAttendee,
    );

    // If attendee not found
    if (appointment.attendees.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Attendee not found",
      });
    }

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

export const getCalendarAppointments = async (req, res) => {
  try {
    const { start, end, status } = req.query;

    const filter = {
      isActive: true,
    };

    // Date range filter
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      filter.startTime = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Role-based filter
    if (req.user.role !== "super_admin") {
      filter.createdBy = req.user._id;
    }

    // Optional status filter
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate("project", "name color")
      .populate("createdBy", "name email profilePic")
      .sort({ startTime: 1 });

    // For calendar display, we'll set a default duration of 1 hour
    const calendarEvents = appointments.map((appointment) => {
      const endTime = new Date(appointment.startTime);
      endTime.setHours(endTime.getHours() + 1); // Default 1-hour duration

      return {
        id: appointment._id,
        title: appointment.title,
        start: appointment.startTime,
        end: endTime,
        allDay: false,
        backgroundColor: getStatusColor(appointment.status),
        borderColor: getStatusColor(appointment.status),
        extendedProps: {
          status: appointment.status,
          location: appointment.location,
          description: appointment.description,
          attendees: appointment.attendees,
          project: appointment.project,
          notes: appointment.notes,
          createdBy: appointment.createdBy,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: calendarEvents,
      total: calendarEvents.length,
      range: start && end ? { start, end } : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to get color based on status
const getStatusColor = (status) => {
  const colors = {
    scheduled: "#3788d8", // blue
    completed: "#28a745", // green
    cancelled: "#dc3545", // red
    rescheduled: "#ffc107", // yellow
  };
  return colors[status] || "#3788d8";
};

export const getAgendaView = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const filter = {
      isActive: true,
      status: { $ne: "cancelled" },
      startTime: { $gte: startDate, $lte: endDate },
    };

    if (req.user.role !== "super_admin") {
      filter.createdBy = req.user._id;
    }

    const appointments = await Appointment.find(filter)
      .populate("project", "name")
      .populate("createdBy", "name")
      .sort({ startTime: 1 });

    // Group appointments by date
    const groupedByDate = {};

    appointments.forEach((appointment) => {
      const dateKey = appointment.startTime.toISOString().split("T")[0];

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }

      groupedByDate[dateKey].push({
        id: appointment._id,
        title: appointment.title,
        time: appointment.startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: appointment.status,
        location: appointment.location,
        project: appointment.project?.name,
      });
    });

    res.status(200).json({
      success: true,
      data: groupedByDate,
      count: appointments.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { startTime, excludeId } = req.query;

    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: "Start time is required",
      });
    }

    const start = new Date(startTime);

    // Check for conflicting appointments at the same time
    const filter = {
      isActive: true,
      status: { $in: ["scheduled", "rescheduled"] },
      startTime: start,
    };

    // Exclude current appointment when checking
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    // For non-admins, only check their own appointments
    if (req.user.role !== "super_admin") {
      filter.createdBy = req.user._id;
    }

    const conflictingAppointments = await Appointment.find(filter).populate(
      "createdBy",
      "name",
    );

    const isAvailable = conflictingAppointments.length === 0;

    res.status(200).json({
      success: true,
      isAvailable,
      conflicts: conflictingAppointments.map((apt) => ({
        id: apt._id,
        title: apt.title,
        startTime: apt.startTime,
        createdBy: apt.createdBy?.name,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
