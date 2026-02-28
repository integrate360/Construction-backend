import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import DailyTaskSummary from "../models/DailyTaskSummary.js";
import cron from "node-cron";

// Auto carry-forward function to be called by cron job
export const autoCarryForwardTasks = async () => {
  try {
    console.log("Running auto carry-forward check...");
    const result = await Task.carryForwardOverdueTasks();

    // Update daily summaries for carried forward tasks
    for (const [key, group] of Object.entries(result.taskGroupsByProject)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let dailySummary = await DailyTaskSummary.findOne({
        labour: group.labourId,
        project: group.projectId,
        date: today,
      });

      if (dailySummary) {
        dailySummary.tasksCarriedForward += group.tasks.length;
        dailySummary.carriedForwardTaskIds.push(
          ...group.tasks.map((t) => t._id),
        );
        dailySummary.totalTasksOverdue += group.tasks.length;
        dailySummary.overdueTaskIds.push(...group.tasks.map((t) => t._id));
        await dailySummary.save();
      } else {
        // Create new summary if doesn't exist
        dailySummary = await DailyTaskSummary.create({
          labour: group.labourId,
          project: group.projectId,
          date: today,
          tasksCarriedForward: group.tasks.length,
          carriedForwardTaskIds: group.tasks.map((t) => t._id),
          totalTasksOverdue: group.tasks.length,
          overdueTaskIds: group.tasks.map((t) => t._id),
        });
      }
    }

    console.log(
      `Auto carry-forward completed. ${result.count} tasks processed.`,
    );
    return result;
  } catch (error) {
    console.error("Error in auto carry-forward:", error);
    throw error;
  }
};

// Schedule auto carry-forward to run daily at midnight
// This will check for overdue tasks and carry them forward
export const scheduleAutoCarryForward = () => {
  // Run at 12:05 AM every day (5 minutes past midnight to ensure all previous day's tasks are processed)
  cron.schedule("5 0 * * *", async () => {
    console.log("Running scheduled auto carry-forward...");
    try {
      await autoCarryForwardTasks();
    } catch (error) {
      console.error("Scheduled auto carry-forward failed:", error);
    }
  });

  // Also run every hour to catch any missed tasks (optional)
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly auto carry-forward check...");
    try {
      await autoCarryForwardTasks();
    } catch (error) {
      console.error("Hourly auto carry-forward failed:", error);
    }
  });

  console.log("Auto carry-forward scheduler initialized");
};

export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } =
      req.body;

    // Validate project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Validate assigned users exist and are labour
    const validLabours = await User.find({
      _id: { $in: assignedTo },
      role: "labour",
    });

    if (validLabours.length !== assignedTo.length) {
      return res.status(400).json({
        success: false,
        message: "Some assigned users are not valid labour",
      });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedBy: req.user.id,
      assignedTo,
      priority,
      dueDate,
    });

    // Update or create daily summary for each labour
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);

    for (const labourId of assignedTo) {
      let dailySummary = await DailyTaskSummary.findOne({
        labour: labourId,
        project,
        date: taskDate,
      });

      if (dailySummary) {
        dailySummary.totalTasksAssigned += 1;
        dailySummary.totalTasksPending += 1;
        dailySummary.pendingTaskIds.push(task._id);
        await dailySummary.save();
      } else {
        await DailyTaskSummary.create({
          labour: labourId,
          project,
          date: taskDate,
          totalTasksAssigned: 1,
          totalTasksPending: 1,
          pendingTaskIds: [task._id],
        });
      }
    }

    // Populate task details
    await task.populate([
      { path: "assignedTo", select: "name email phoneNumber" },
      { path: "assignedBy", select: "name email" },
      { path: "project", select: "projectName siteName" },
    ]);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      project,
      assignedTo,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;

    // Date range filter
    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) query.dueDate.$gte = new Date(fromDate);
      if (toDate) query.dueDate.$lte = new Date(toDate);
    }

    // Role-based filtering
    if (req.user.role === "labour") {
      query.assignedTo = req.user.id;
    } else if (req.user.role === "site_manager") {
      // Get projects managed by this site manager
      const projects = await Project.find({
        site_manager: req.user.id,
      }).distinct("_id");
      query.project = { $in: projects };
    }
    // Super admin can see all tasks

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email phoneNumber")
      .populate("assignedBy", "name email role")
      .populate("project", "projectName siteName")
      .populate("originalTask", "title status")
      .populate("completedBy", "name email role")
      .sort({ priority: -1, dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tasks,
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

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email phoneNumber")
      .populate("assignedBy", "name email role")
      .populate("project", "projectName siteName location")
      .populate("originalTask", "title status dueDate")
      .populate("completedBy", "name email role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check authorization
    if (req.user.role === "site_manager") {
      const project = await Project.findById(task.project);
      if (project.site_manager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this task",
        });
      }
    }
    // Super admin can update any task

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (status) task.status = status;

    await task.save();

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedBy", select: "name email" },
      { path: "project", select: "projectName" },
      { path: "completedBy", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeTask = async (req, res) => {
  try {
    const notes = req.body?.notes || null;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Task already completed",
      });
    }

    // Mark task as completed (notes optional)
    if (notes) {
      await task.markAsCompleted(notes);
    } else {
      await task.markAsCompleted();
    }

    // Update daily summary
    const completionDate = new Date();
    completionDate.setHours(0, 0, 0, 0);

    for (const labourId of task.assignedTo) {
      let dailySummary = await DailyTaskSummary.findOne({
        labour: labourId,
        project: task.project,
        date: completionDate,
      });

      if (dailySummary) {
        dailySummary.totalTasksCompleted += 1;
        dailySummary.completedTaskIds.push(task._id);
        await dailySummary.save();
      } else {
        await DailyTaskSummary.create({
          labour: labourId,
          project: task.project,
          date: completionDate,
          totalTasksAssigned: 1,
          totalTasksCompleted: 1,
          completedTaskIds: [task._id],
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Task marked as completed",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const carryForwardTasks = async (req, res) => {
  try {
    const { project, date, newDueDate } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Find all pending tasks for the specified date
    const pendingTasks = await Task.find({
      project,
      status: { $in: ["pending", "in_progress", "overdue"] },
      dueDate: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const carriedTasks = [];

    // Carry forward each pending task
    for (const task of pendingTasks) {
      const carriedTask = await task.carryForward(
        newDueDate || new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        task.priority,
      );
      carriedTasks.push(carriedTask);
    }

    // Update daily summary for carried forward tasks
    const labourGroups = {};
    pendingTasks.forEach((task) => {
      task.assignedTo.forEach((labourId) => {
        if (!labourGroups[labourId]) {
          labourGroups[labourId] = {
            tasks: [],
            labourId,
            project: task.project,
          };
        }
        labourGroups[labourId].tasks.push(task);
      });
    });

    for (const group of Object.values(labourGroups)) {
      let dailySummary = await DailyTaskSummary.findOne({
        labour: group.labourId,
        project: group.project,
        date: targetDate,
      });

      if (dailySummary) {
        dailySummary.tasksCarriedForward += group.tasks.length;
        dailySummary.carriedForwardTaskIds.push(
          ...group.tasks.map((t) => t._id),
        );
        dailySummary.totalTasksOverdue += group.tasks.length;
        dailySummary.overdueTaskIds.push(...group.tasks.map((t) => t._id));
        await dailySummary.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `${carriedTasks.length} tasks carried forward successfully`,
      data: carriedTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLabourTaskSummary = async (req, res) => {
  try {
    const { labourId } = req.params;
    const { fromDate, toDate } = req.query;

    const query = { labour: labourId };

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const summaries = await DailyTaskSummary.find(query)
      .populate("project", "projectName siteName")
      .populate("completedTaskIds", "title priority")
      .populate("pendingTaskIds", "title priority dueDate")
      .populate("overdueTaskIds", "title priority dueDate")
      .populate("carriedForwardTaskIds", "title priority newDueDate")
      .sort({ date: -1 });

    // Calculate totals
    const totals = summaries.reduce(
      (acc, summary) => {
        acc.totalAssigned += summary.totalTasksAssigned;
        acc.totalCompleted += summary.totalTasksCompleted;
        acc.totalPending += summary.totalTasksPending;
        acc.totalOverdue += summary.totalTasksOverdue || 0;
        acc.totalCarriedForward += summary.tasksCarriedForward;
        return acc;
      },
      {
        totalAssigned: 0,
        totalCompleted: 0,
        totalPending: 0,
        totalOverdue: 0,
        totalCarriedForward: 0,
      },
    );

    res.status(200).json({
      success: true,
      data: {
        summaries,
        totals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectTaskDashboard = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name")
      .populate("completedBy", "name email role");

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "in_progress",
    ).length;
    const carriedForwardTasks = tasks.filter(
      (t) => t.status === "carried_forward",
    ).length;
    const overdueTasks = tasks.filter((t) => t.status === "overdue").length;

    // Group by priority
    const byPriority = {
      critical: tasks.filter((t) => t.priority === "critical").length,
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    };

    // Group by status
    const byStatus = {
      completed: completedTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      carriedForward: carriedForwardTasks,
      overdue: overdueTasks,
    };

    // Group by labour
    const byLabour = {};
    tasks.forEach((task) => {
      task.assignedTo.forEach((labour) => {
        const labourId = labour._id.toString();
        if (!byLabour[labourId]) {
          byLabour[labourId] = {
            labourName: labour.name,
            assigned: 0,
            completed: 0,
            pending: 0,
            inProgress: 0,
            overdue: 0,
            carriedForward: 0,
          };
        }
        byLabour[labourId].assigned += 1;
        if (task.status === "completed") byLabour[labourId].completed += 1;
        if (task.status === "pending") byLabour[labourId].pending += 1;
        if (task.status === "in_progress") byLabour[labourId].inProgress += 1;
        if (task.status === "overdue") byLabour[labourId].overdue += 1;
        if (task.status === "carried_forward")
          byLabour[labourId].carriedForward += 1;
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        carriedForwardTasks,
        overdueTasks,
        completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
        overdueRate: totalTasks ? (overdueTasks / totalTasks) * 100 : 0,
        byPriority,
        byStatus,
        byLabour: Object.values(byLabour),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Manual trigger for auto carry-forward (admin only)
export const triggerAutoCarryForward = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can manually trigger auto carry-forward",
      });
    }

    const result = await autoCarryForwardTasks();

    res.status(200).json({
      success: true,
      message: `Auto carry-forward completed. ${result.count} tasks processed.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      project,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = "asc",
    } = req.query;

    const query = {
      assignedTo: req.user.id,
      isActive: true,
    };

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;

    // Date filters
    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) query.dueDate.$gte = new Date(fromDate);
      if (toDate) query.dueDate.$lte = new Date(toDate);
    }

    // If user manually sends sortBy → normal sorting
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch tasks
    let tasks = await Task.find(query)
      .populate("project", "projectName siteName location")
      .populate("assignedBy", "name email role")
      .populate("originalTask", "title status")
      .sort(sortBy ? sort : {}) // only apply DB sort if sortBy exists
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // ----------------------------------------------------------
    // ✅ DEFAULT SORTING (When sortBy is NOT passed)
    // STATUS ➜ PRIORITY ➜ DUEDATE
    // ----------------------------------------------------------
    if (!sortBy) {
      const statusOrder = {
        pending: 1,
        in_progress: 2,
        carried_forward: 3,
        overdue: 4,
        completed: 5,
      };

      const priorityOrder = {
        critical: 1,
        high: 2,
        medium: 3,
        low: 4,
      };

      tasks.sort((a, b) => {
        // 1) Sort by status
        const aStatus = statusOrder[a.status] || 99;
        const bStatus = statusOrder[b.status] || 99;

        if (aStatus !== bStatus) return aStatus - bStatus;

        // 2) Same status → sort by priority
        const aPriority = priorityOrder[a.priority] || 99;
        const bPriority = priorityOrder[b.priority] || 99;

        if (aPriority !== bPriority) return aPriority - bPriority;

        // 3) Same priority → sort by dueDate
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }

    // Count total
    const total = await Task.countDocuments(query);

    // Statistics
    const statistics = await Task.aggregate([
      { $match: { assignedTo: req.user.id, isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = {
      total,
      pending: 0,
      in_progress: 0,
      completed: 0,
      carried_forward: 0,
      overdue: 0,
    };

    statistics.forEach((s) => {
      if (s._id === "pending") stats.pending = s.count;
      if (s._id === "in_progress") stats.in_progress = s.count;
      if (s._id === "completed") stats.completed = s.count;
      if (s._id === "carried_forward") stats.carried_forward = s.count;
    });

    // TODAY BOUNDARIES
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // TODAY TASKS
    const todayTasksData = await Task.find({
      assignedTo: req.user.id,
      dueDate: { $gte: today, $lt: tomorrow },
      isActive: true,
      status: { $ne: "completed" },
    })
      .populate("project", "projectName")
      .lean();

    const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };

    todayTasksData.sort((a, b) => {
      const pa = priorityOrder[a.priority] || 99;
      const pb = priorityOrder[b.priority] || 99;

      if (pa !== pb) return pa - pb;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    // UPCOMING TASKS
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasksData = await Task.find({
      assignedTo: req.user.id,
      dueDate: { $gt: tomorrow, $lte: nextWeek },
      isActive: true,
      status: { $ne: "completed" },
    })
      .populate("project", "projectName")
      .lean();

    upcomingTasksData.sort((a, b) => {
      const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
      if (dateCompare !== 0) return dateCompare;

      const pa = priorityOrder[a.priority] || 99;
      const pb = priorityOrder[b.priority] || 99;
      return pa - pb;
    });

    const limitedUpcomingTasks = upcomingTasksData.slice(0, 5);

    // OVERDUE TASKS
    const overdueTasksData = await Task.find({
      assignedTo: req.user.id,
      dueDate: { $lt: today },
      status: { $nin: ["completed"] },
      isActive: true,
    })
      .populate("project", "projectName")
      .lean();

    overdueTasksData.sort((a, b) => {
      const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
      if (dateCompare !== 0) return dateCompare;

      const pa = priorityOrder[a.priority] || 99;
      const pb = priorityOrder[b.priority] || 99;

      return pa - pb;
    });

    stats.overdue = overdueTasksData.length;

    // FINAL RESPONSE
    res.status(200).json({
      success: true,
      data: {
        tasks,
        statistics: stats,
        todayTasks: {
          count: todayTasksData.length,
          tasks: todayTasksData,
        },
        upcomingTasks: {
          count: upcomingTasksData.length,
          tasks: limitedUpcomingTasks,
        },
        overdueTasks: {
          count: overdueTasksData.length,
          tasks: overdueTasksData,
        },
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getMyTasks:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
