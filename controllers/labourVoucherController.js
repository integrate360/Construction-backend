import  LabourVoucher  from "../models/LabourVoucher.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const createLabourVoucher = async (req, res) => {
  try {
    const {
      voucher,
      project,
      paidAmount,
      paymentMode,
      paymentDate,
      remarks,
      user,
    } = req.body;

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (req.user.role === "site_manager") {
      const isAssignedManager =
        projectExists.site_manager?.toString() === req.user.id;
      if (!isAssignedManager) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create vouchers for this project",
        });
      }
    }
    const labourUser = await User.findById(user);
    if (!labourUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (labourUser.role !== "labour") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a labour",
      });
    }
    let voucherNumber = voucher;
    if (!voucherNumber) {
      const count = (await LabourVoucher.countDocuments()) + 1;
      voucherNumber = `LV-${new Date().getFullYear()}-${String(count).padStart(6, "0")}`;
    }

    const labourVoucher = await LabourVoucher.create({
      voucher: voucherNumber,
      user: labourUser._id,
      project: projectExists._id,
      paidAmount,
      paymentMode,
      paymentDate: paymentDate || Date.now(),
      remarks,
      createdBy: req.user.id,
      status: "paid",
    });
    const populatedVoucher = await LabourVoucher.findById(labourVoucher._id)
      .populate("user", "name email phoneNumber role")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      data: populatedVoucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating labour voucher",
      error: error.message,
    });
  }
};

export const getAllLabourVouchers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      project,
      user,
      startDate,
      endDate,
      paymentMode,
      search,
    } = req.query;

    const filter = {};

    if (req.user.role === "site_manager") {
      // Site managers can only see vouchers for their projects
      const managedProjects = await Project.find({
        site_manager: req.user.id,
      }).select("_id");
      filter.project = { $in: managedProjects.map((p) => p._id) };
    } else if (req.user.role === "labour") {
      filter.user = req.user.id;
    }
    if (status) filter.status = status;
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (paymentMode) filter.paymentMode = paymentMode;

    // Search by voucher number or remarks
    if (search) {
      filter.$or = [
        { voucher: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const labourVouchers = await LabourVoucher.find(filter)
      .populate("user", "name email phoneNumber role")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await LabourVoucher.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: labourVouchers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: labourVouchers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching labour vouchers",
      error: error.message,
    });
  }
};

export const getLabourVoucherById = async (req, res) => {
  try {
    const labourVoucher = await LabourVoucher.findById(req.params.id)
      .populate("user", "name email phoneNumber role address adharNumber")
      .populate("project", "projectName siteName location site_manager")
      .populate("createdBy", "name email role");

    if (!labourVoucher) {
      return res.status(404).json({
        success: false,
        message: "Labour voucher not found",
      });
    }

    // Check authorization
    if (req.user.role === "site_manager") {
      const project = await Project.findById(labourVoucher.project);
      if (project.site_manager?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this voucher",
        });
      }
    } else if (req.user.role === "labour") {
      if (labourVoucher.user._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this voucher",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: labourVoucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching labour voucher",
      error: error.message,
    });
  }
};

export const updateLabourVoucher = async (req, res) => {
  try {
    const { paidAmount, paymentMode, paymentDate, remarks, status } = req.body;

    let labourVoucher = await LabourVoucher.findById(req.params.id);

    if (!labourVoucher) {
      return res.status(404).json({
        success: false,
        message: "Labour voucher not found",
      });
    }
    if (!["super_admin", "saas_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update vouchers",
      });
    }

    labourVoucher.paidAmount = paidAmount || labourVoucher.paidAmount;
    labourVoucher.paymentMode = paymentMode || labourVoucher.paymentMode;
    labourVoucher.paymentDate = paymentDate || labourVoucher.paymentDate;
    labourVoucher.remarks = remarks || labourVoucher.remarks;
    labourVoucher.status = status || labourVoucher.status;

    await labourVoucher.save();

    // Populate response
    labourVoucher = await LabourVoucher.findById(req.params.id)
      .populate("user", "name email phoneNumber role")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      data: labourVoucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating labour voucher",
      error: error.message,
    });
  }
};

export const cancelLabourVoucher = async (req, res) => {
  try {
    const labourVoucher = await LabourVoucher.findById(req.params.id);

    if (!labourVoucher) {
      return res.status(404).json({
        success: false,
        message: "Labour voucher not found",
      });
    }

    // Check authorization
    if (req.user.role === "site_manager") {
      const project = await Project.findById(labourVoucher.project);
      if (project.site_manager?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to cancel this voucher",
        });
      }
    } else if (!["super_admin", "saas_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel vouchers",
      });
    }

    labourVoucher.status = "cancelled";
    await labourVoucher.save();

    res.status(200).json({
      success: true,
      message: "Voucher cancelled successfully",
      data: labourVoucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling labour voucher",
      error: error.message,
    });
  }
};

export const getLabourVoucherStats = async (req, res) => {
  try {
    const { project, user, startDate, endDate } = req.query;

    // Build match stage
    const match = {};

    if (project) match.project = new mongoose.Types.ObjectId(project);
    if (user) match.user = new mongoose.Types.ObjectId(user);

    if (startDate || endDate) {
      match.paymentDate = {};
      if (startDate) match.paymentDate.$gte = new Date(startDate);
      if (endDate) match.paymentDate.$lte = new Date(endDate);
    }

    // Role-based filtering
    if (req.user.role === "site_manager") {
      const managedProjects = await Project.find({
        site_manager: req.user.id,
      }).select("_id");
      match.project = { $in: managedProjects.map((p) => p._id) };
    } else if (req.user.role === "labour") {
      match.user = new mongoose.Types.ObjectId(req.user.id);
    }

    const stats = await LabourVoucher.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPaidAmount: { $sum: "$paidAmount" },
          totalVouchers: { $sum: 1 },
          avgAmount: { $avg: "$paidAmount" },
          maxAmount: { $max: "$paidAmount" },
          minAmount: { $min: "$paidAmount" },
          voucherCounts: {
            $push: {
              status: "$status",
              amount: "$paidAmount",
            },
          },
        },
      },
      {
        $project: {
          totalPaidAmount: 1,
          totalVouchers: 1,
          avgAmount: 1,
          maxAmount: 1,
          minAmount: 1,
          statusBreakdown: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$voucherCounts.status"] },
                as: "status",
                in: {
                  k: "$$status",
                  v: {
                    $size: {
                      $filter: {
                        input: "$voucherCounts",
                        cond: { $eq: ["$$this.status", "$$status"] },
                      },
                    },
                  },
                },
              },
            },
          },
          amountByStatus: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$voucherCounts.status"] },
                as: "status",
                in: {
                  k: "$$status",
                  v: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$voucherCounts",
                            cond: { $eq: ["$$this.status", "$$status"] },
                          },
                        },
                        as: "item",
                        in: "$$item.amount",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    // Get payment mode breakdown
    const paymentModeStats = await LabourVoucher.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMode",
          count: { $sum: 1 },
          total: { $sum: "$paidAmount" },
        },
      },
    ]);

    // Get monthly trend
    const monthlyTrend = await LabourVoucher.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          total: { $sum: "$paidAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalPaidAmount: 0,
          totalVouchers: 0,
          avgAmount: 0,
          maxAmount: 0,
          minAmount: 0,
          statusBreakdown: {},
          amountByStatus: {},
        },
        paymentModeBreakdown: paymentModeStats,
        monthlyTrend,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching labour voucher statistics",
      error: error.message,
    });
  }
};

export const getVouchersByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check project exists and authorization
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check authorization
    if (req.user.role === "site_manager") {
      if (project.site_manager?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view vouchers for this project",
        });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vouchers = await LabourVoucher.find({ project: projectId })
      .populate("user", "name email phoneNumber")
      .populate("createdBy", "name email")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LabourVoucher.countDocuments({ project: projectId });

    // Calculate project total
    const projectTotal = await LabourVoucher.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);

    res.status(200).json({
      success: true,
      count: vouchers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      projectTotal: projectTotal[0]?.total || 0,
      data: vouchers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching project vouchers",
      error: error.message,
    });
  }
};

export const getVouchersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check authorization
    if (req.user.role === "labour" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own vouchers",
      });
    }

    // Check user exists and has labour role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vouchers = await LabourVoucher.find({ user: userId })
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LabourVoucher.countDocuments({ user: userId });

    // Calculate user total
    const userTotal = await LabourVoucher.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);

    res.status(200).json({
      success: true,
      count: vouchers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      userTotal: userTotal[0]?.total || 0,
      data: vouchers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user vouchers",
      error: error.message,
    });
  }
};

