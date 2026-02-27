import mongoose from "mongoose";
import { Payroll, SalaryStructure, Advance } from "../models/Salary.js";
import { calcPayroll, getAttendanceSummary } from "../helpers/Payrollhelper.js";
import { generateSalarySlipPDF } from "../helpers/generateSalarySlipPDF.js";
import projectModel from "../models/Project.js";

export const createSalaryStructure = async (req, res) => {
  try {
    const {
      user,
      project,
      role,
      salaryType,
      rateAmount,
      overtimeRate,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    // Deactivate existing active structures
    await SalaryStructure.updateMany(
      { user, project, isActive: true },
      { isActive: false, effectiveTo: new Date() },
    );

    const structure = await SalaryStructure.create({
      user,
      project,
      role,
      salaryType,
      rateAmount,
      overtimeRate,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo,
      createdBy: req.user.id,
    });

    // Populate the created structure
    const populatedStructure = await SalaryStructure.findById(structure._id)
      .populate("user", "name email role phoneNumber profilePicture")
      .populate("project", "projectName siteName location client")
      .populate("createdBy", "name email role profilePicture");

    res.status(201).json({ success: true, data: populatedStructure });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllSalaryStructures = async (req, res) => {
  try {
    const {
      project,
      user,
      role,
      isActive,
      salaryType,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (role) filter.role = role;
    if (salaryType) filter.salaryType = salaryType;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // If search is provided, first find matching users
    let userIds = [];
    if (search) {
      const UserModel = mongoose.model("User");
      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      userIds = matchingUsers.map((u) => u._id);

      // Also search by project name
      const ProjectModel = mongoose.model("Project");
      const matchingProjects = await ProjectModel.find({
        $or: [
          { projectName: { $regex: search, $options: "i" } },
          { siteName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const projectIds = matchingProjects.map((p) => p._id);

      filter.$or = [
        { user: { $in: userIds } },
        { project: { $in: projectIds } },
      ];
    }

    const totalDocuments = await SalaryStructure.countDocuments(filter);

    const structures = await SalaryStructure.find(filter)
      .populate({
        path: "user",
        select:
          "name email role phoneNumber profilePicture adharNumber isActive",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email phoneNumber" },
          { path: "site_manager", select: "name email phoneNumber" },
        ],
      })
      .populate("createdBy", "name email role profilePicture")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: structures.length,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
      data: structures,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalaryStructureById = async (req, res) => {
  try {
    const structure = await SalaryStructure.findById(req.params.id)
      .populate({
        path: "user",
        select:
          "name email role phoneNumber profilePicture adharNumber panNumber address isActive",
      })
      .populate({
        path: "project",
        select:
          "projectName siteName location client site_manager startDate expectedEndDate projectStatus",
        populate: [
          { path: "client", select: "name email phoneNumber companyName" },
          {
            path: "site_manager",
            select: "name email phoneNumber profilePicture",
          },
        ],
      })
      .populate("createdBy", "name email role profilePicture");

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    res.status(200).json({ success: true, data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate([
      { path: "user", select: "name email role phoneNumber" },
      { path: "project", select: "projectName siteName" },
      { path: "createdBy", select: "name email" },
    ]);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    res.status(200).json({ success: true, data: structure });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.findByIdAndUpdate(
      req.params.id,
      { isActive: false, effectiveTo: new Date() },
      { new: true },
    );

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Salary structure deactivated successfully",
      data: structure,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.findOne({
      user: req.params.userId,
      project: req.params.projectId,
      isActive: true,
    })
      .populate({
        path: "user",
        select: "name email role phoneNumber profilePicture adharNumber",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email phoneNumber" },
          { path: "site_manager", select: "name email phoneNumber" },
        ],
      })
      .populate("createdBy", "name email role");

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "No active salary structure found",
      });
    }

    res.status(200).json({ success: true, data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generatePayroll = async (req, res) => {
  try {
    const {
      user,
      project,
      periodStart,
      periodEnd,
      allowances = [],
      deductions = [],
      overtimeHours = 0,
      remarks,
    } = req.body;

    // Check duplicate
    const exists = await Payroll.findOne({
      user,
      project,
      periodStart,
      periodEnd,
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Payroll already generated for this period",
      });
    }

    // Get active salary structure
    const structure = await SalaryStructure.findOne({
      user,
      project,
      isActive: true,
    });
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "No active salary structure found for this user on this project",
      });
    }

    // Get attendance summary
    const { presentDays, absentDays, totalWorkingDays, attendanceRecords } =
      await getAttendanceSummary(user, project, periodStart, periodEnd);

    // Get pending advances
    const pendingAdvances = await Advance.find({
      user,
      project,
      recoveryStatus: { $ne: "recovered" },
    }).populate("createdBy", "name");

    const totalAdvancePaid = pendingAdvances.reduce(
      (sum, a) => sum + a.amount,
      0,
    );

    // ✅ Total pending advance balance (how much is still owed)
    const totalPendingAdvanceBalance = pendingAdvances.reduce(
      (sum, a) => sum + (a.amount - a.amountRecovered),
      0,
    );

    // ✅ Extract advance recovery amount from deductions
    const advanceRecoveryInThisPayroll = deductions
      .filter((d) => d.reason === "advance_recovery")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // ✅ Calculate gross salary WITHOUT advance_recovery deduction
    // so we know the true earning capacity before recovery is applied
    const deductionsWithoutAdvance = deductions.filter(
      (d) => d.reason !== "advance_recovery",
    );

    const {
      basicSalary,
      overtimePay,
      totalAllowances,
      totalDeductions: totalDeductionsWithoutAdvance,
      grossSalary,
    } = calcPayroll(
      structure,
      presentDays,
      overtimeHours,
      allowances,
      deductionsWithoutAdvance, // ✅ exclude advance_recovery for clean gross calculation
    );

    // ✅ Max recoverable = gross salary - other deductions (not advance_recovery)
    // This is the actual take-home before advance recovery is applied
    const salaryBeforeAdvanceRecovery = grossSalary - totalDeductionsWithoutAdvance;

    // ✅ Validate 1: Recovery cannot exceed what the labourer earned this period
    if (advanceRecoveryInThisPayroll > salaryBeforeAdvanceRecovery) {
      return res.status(400).json({
        success: false,
        message: `Advance recovery ₹${advanceRecoveryInThisPayroll} cannot exceed labourer's net earnings ₹${salaryBeforeAdvanceRecovery} for this period.`,
      });
    }

    // ✅ Validate 2: Recovery cannot exceed total pending advance balance
    if (advanceRecoveryInThisPayroll > totalPendingAdvanceBalance) {
      return res.status(400).json({
        success: false,
        message: `Advance recovery ₹${advanceRecoveryInThisPayroll} exceeds total pending advance balance ₹${totalPendingAdvanceBalance}.`,
      });
    }

    // ✅ Now calculate final payroll WITH all deductions (including advance_recovery)
    const {
      totalDeductions,
      netSalary,
    } = calcPayroll(
      structure,
      presentDays,
      overtimeHours,
      allowances,
      deductions, // full deductions including advance_recovery
    );

    // ✅ Create payroll
    const payroll = await Payroll.create({
      user,
      project,
      salaryStructure: structure._id,
      role: structure.role,
      periodStart,
      periodEnd,
      totalWorkingDays,
      presentDays,
      absentDays,
      overtimeHours,
      basicSalary,
      overtimePay,
      allowances,
      deductions,
      totalAllowances,
      totalDeductions,
      grossSalary,
      netSalary,
      advancePaid: totalAdvancePaid,
      advanceRecovered: advanceRecoveryInThisPayroll,
      remarks,
      createdBy: req.user.id,
    });

    // ✅ Update Advance records using FIFO (oldest advance recovered first)
    if (advanceRecoveryInThisPayroll > 0) {
      let remainingToRecover = advanceRecoveryInThisPayroll;

      const advancesToRecover = await Advance.find({
        user,
        project,
        recoveryStatus: { $ne: "recovered" },
      }).sort({ givenDate: 1 }); // oldest first

      for (const advance of advancesToRecover) {
        if (remainingToRecover <= 0) break;

        const advanceRemaining = advance.amount - advance.amountRecovered;
        const recoverNow = Math.min(advanceRemaining, remainingToRecover);

        advance.amountRecovered += recoverNow;
        advance.recoveryStatus =
          advance.amountRecovered >= advance.amount
            ? "recovered"
            : "partially_recovered";

        await advance.save();
        remainingToRecover -= recoverNow;
      }
    }

    // Populate the created payroll
    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({
        path: "user",
        select: "name email role phoneNumber profilePicture adharNumber",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email phoneNumber" },
          { path: "site_manager", select: "name email phoneNumber" },
        ],
      })
      .populate({
        path: "salaryStructure",
        select: "salaryType rateAmount overtimeRate effectiveFrom",
      })
      .populate("createdBy", "name email role profilePicture");

    res.status(201).json({
      success: true,
      data: populatedPayroll,
      attendance: attendanceRecords,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const generateBulkPayroll = async (req, res) => {
  try {
    const {
      project,
      periodStart,
      periodEnd,
      allowances = [],
      deductions = [],
    } = req.body;

    const structures = await SalaryStructure.find({ project, isActive: true })
      .populate("user", "name email role phoneNumber")
      .populate("project", "projectName siteName");

    if (!structures.length) {
      return res.status(404).json({
        success: false,
        message: "No active salary structures found for this project",
      });
    }

    const results = { success: [], failed: [] };

    for (const structure of structures) {
      try {
        const exists = await Payroll.findOne({
          user: structure.user._id,
          project,
          periodStart,
          periodEnd,
        });

        if (exists) {
          results.failed.push({
            user: structure.user,
            reason: "Already generated",
          });
          continue;
        }

        const { presentDays, absentDays, totalWorkingDays } =
          await getAttendanceSummary(
            structure.user._id,
            project,
            periodStart,
            periodEnd,
          );

        const {
          basicSalary,
          overtimePay,
          totalAllowances,
          totalDeductions,
          grossSalary,
          netSalary,
        } = calcPayroll(structure, presentDays, 0, allowances, deductions);

        const payroll = await Payroll.create({
          user: structure.user._id,
          project,
          salaryStructure: structure._id,
          role: structure.role,
          periodStart,
          periodEnd,
          totalWorkingDays,
          presentDays,
          absentDays,
          overtimeHours: 0,
          basicSalary,
          overtimePay,
          allowances,
          deductions,
          totalAllowances,
          totalDeductions,
          grossSalary,
          netSalary,
          createdBy: req.user.id,
        });

        // Populate the created payroll
        const populatedPayroll = await Payroll.findById(payroll._id)
          .populate("user", "name email role phoneNumber")
          .populate("project", "projectName siteName")
          .populate("salaryStructure", "salaryType rateAmount");

        results.success.push({
          user: structure.user,
          payroll: populatedPayroll,
        });
      } catch (err) {
        results.failed.push({
          user: structure.user,
          reason: err.message,
        });
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllPayrolls = async (req, res) => {
  try {
    const {
      project,
      user,
      role,
      paymentStatus,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (role) filter.role = role;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Search by user name/email or project name
    if (search) {
      const UserModel = mongoose.model("User");
      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      const ProjectModel = mongoose.model("Project");
      const matchingProjects = await ProjectModel.find({
        $or: [
          { projectName: { $regex: search, $options: "i" } },
          { siteName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const projectIds = matchingProjects.map((p) => p._id);

      filter.$or = [
        { user: { $in: userIds } },
        { project: { $in: projectIds } },
        { remarks: { $regex: search, $options: "i" } },
        { transactionReference: { $regex: search, $options: "i" } },
      ];
    }

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Count total documents for pagination
    const totalDocuments = await Payroll.countDocuments(filter);

    const payrolls = await Payroll.find(filter)
      .populate({
        path: "user",
        select: "name email role phoneNumber profilePicture adharNumber",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email phoneNumber" },
          { path: "site_manager", select: "name email phoneNumber" },
        ],
      })
      .populate({
        path: "salaryStructure",
        select: "salaryType rateAmount overtimeRate effectiveFrom",
      })
      .populate("createdBy", "name email role")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Build summary (same as before)
    const summary = {
      totalPayrolls: payrolls.length,
      totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      totalGrossSalary: payrolls.reduce((sum, p) => sum + p.grossSalary, 0),
      totalPaid: payrolls.filter((p) => p.paymentStatus === "paid").length,
      totalPending: payrolls.filter((p) => p.paymentStatus === "pending")
        .length,
      totalPartiallyPaid: payrolls.filter(
        (p) => p.paymentStatus === "partially_paid",
      ).length,
    };

    res.status(200).json({
      success: true,
      count: payrolls.length,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
      summary,
      data: payrolls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: "user",
        select:
          "name email role phoneNumber profilePicture adharNumber panNumber address isActive",
      })
      .populate({
        path: "project",
        select:
          "projectName siteName location client site_manager startDate expectedEndDate projectStatus",
        populate: [
          {
            path: "client",
            select: "name email phoneNumber companyName gstNumber address",
          },
          {
            path: "site_manager",
            select: "name email phoneNumber profilePicture",
          },
        ],
      })
      .populate({
        path: "salaryStructure",
        select:
          "salaryType rateAmount overtimeRate effectiveFrom effectiveTo createdBy",
        populate: {
          path: "createdBy",
          select: "name email",
        },
      })
      .populate("createdBy", "name email role profilePicture");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // Get related advances for this user/project
    const advances = await Advance.find({
      user: payroll.user._id,
      project: payroll.project._id,
    })
      .populate("createdBy", "name")
      .sort({ givenDate: -1 });

    res.status(200).json({
      success: true,
      data: payroll,
      relatedAdvances: advances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a paid payroll",
      });
    }

    const { allowances, deductions, overtimeHours, remarks } = req.body;

    if (allowances !== undefined) payroll.allowances = allowances;
    if (deductions !== undefined) payroll.deductions = deductions;
    if (overtimeHours !== undefined) payroll.overtimeHours = overtimeHours;
    if (remarks !== undefined) payroll.remarks = remarks;

    // Recalculate financials
    const structure = await SalaryStructure.findById(payroll.salaryStructure);
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Linked salary structure not found",
      });
    }

    const {
      basicSalary,
      overtimePay,
      totalAllowances,
      totalDeductions,
      grossSalary,
      netSalary,
    } = calcPayroll(
      structure,
      payroll.presentDays,
      payroll.overtimeHours,
      payroll.allowances,
      payroll.deductions,
    );

    payroll.basicSalary = basicSalary;
    payroll.overtimePay = overtimePay;
    payroll.totalAllowances = totalAllowances;
    payroll.totalDeductions = totalDeductions;
    payroll.grossSalary = grossSalary;
    payroll.netSalary = netSalary;

    await payroll.save();

    // Populate the updated payroll
    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate("user", "name email role phoneNumber")
      .populate("project", "projectName siteName")
      .populate("salaryStructure", "salaryType rateAmount")
      .populate("createdBy", "name email");

    res.status(200).json({ success: true, data: updatedPayroll });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markPayrollAsPaid = async (req, res) => {
  try {
    const { paymentMode, transactionReference, paymentDate } = req.body;

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: "paid",
        paymentMode,
        transactionReference,
        paymentDate: paymentDate || new Date(),
      },
      { new: true, runValidators: true },
    )
      .populate("user", "name email phoneNumber profilePicture")
      .populate("project", "projectName siteName location")
      .populate("salaryStructure", "salaryType rateAmount");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payroll marked as paid successfully",
      data: payroll,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProjectPayrollSummary = async (req, res) => {
  try {
    const summary = await Payroll.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalNet: { $sum: "$netSalary" },
          totalGross: { $sum: "$grossSalary" },
          totalBasic: { $sum: "$basicSalary" },
          totalOvertime: { $sum: "$overtimePay" },
          totalAllowances: { $sum: "$totalAllowances" },
          totalDeductions: { $sum: "$totalDeductions" },
          totalAdvancePaid: { $sum: "$advancePaid" },
          totalAdvanceRecovered: { $sum: "$advanceRecovered" },
        },
      },
    ]);

    // Get user breakdown
    const userBreakdown = await Payroll.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $group: {
          _id: "$user",
          totalPayrolls: { $sum: 1 },
          totalNetSalary: { $sum: "$netSalary" },
          paymentStatuses: { $addToSet: "$paymentStatus" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          "userDetails.name": 1,
          "userDetails.email": 1,
          "userDetails.role": 1,
          totalPayrolls: 1,
          totalNetSalary: 1,
          paymentStatuses: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: summary,
        byUser: userBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payrolls can be deleted",
      });
    }

    await payroll.deleteOne();
    res.status(200).json({
      success: true,
      message: "Payroll deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const giveAdvance = async (req, res) => {
  try {
    const { user, project, amount, reason, givenDate } = req.body;

    const advance = await Advance.create({
      user,
      project,
      amount,
      reason,
      givenDate: givenDate || new Date(),
      createdBy: req.user.id,
    });

    // Populate the created advance
    const populatedAdvance = await Advance.findById(advance._id)
      .populate({
        path: "user",
        select: "name email role phoneNumber profilePicture adharNumber",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email" },
          { path: "site_manager", select: "name email" },
        ],
      })
      .populate("createdBy", "name email role profilePicture");

    res.status(201).json({ success: true, data: populatedAdvance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllAdvances = async (req, res) => {
  try {
    const {
      project,
      user,
      recoveryStatus,
      search,
      sortBy = "givenDate",
      sortOrder = "desc",
    } = req.query;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (recoveryStatus) filter.recoveryStatus = recoveryStatus;

    // Search by user name/email or reason
    if (search) {
      const UserModel = mongoose.model("User");
      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      const ProjectModel = mongoose.model("Project");
      const matchingProjects = await ProjectModel.find({
        $or: [
          { projectName: { $regex: search, $options: "i" } },
          { siteName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const projectIds = matchingProjects.map((p) => p._id);

      filter.$or = [
        { user: { $in: userIds } },
        { project: { $in: projectIds } },
        { reason: { $regex: search, $options: "i" } },
      ];
    }

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const totalDocuments = await Advance.countDocuments(filter);

    const advances = await Advance.find(filter)
      .populate({
        path: "user",
        select:
          "name email role phoneNumber profilePicture adharNumber isActive",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email" },
          { path: "site_manager", select: "name email" },
        ],
      })
      .populate("createdBy", "name email role")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Calculate summary
    const summary = {
      totalAdvances: advances.length,
      totalAmount: advances.reduce((sum, a) => sum + a.amount, 0),
      totalRecovered: advances.reduce((sum, a) => sum + a.amountRecovered, 0),
      totalPending: advances.reduce(
        (sum, a) => sum + (a.amount - a.amountRecovered),
        0,
      ),
      byStatus: {
        pending: advances.filter((a) => a.recoveryStatus === "pending").length,
        partially_recovered: advances.filter(
          (a) => a.recoveryStatus === "partially_recovered",
        ).length,
        recovered: advances.filter((a) => a.recoveryStatus === "recovered")
          .length,
      },
    };

    res.status(200).json({
      success: true,
      count: advances.length,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
      summary,
      data: advances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdvanceById = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id)
      .populate({
        path: "user",
        select:
          "name email role phoneNumber profilePicture adharNumber panNumber address isActive",
      })
      .populate({
        path: "project",
        select:
          "projectName siteName location client site_manager startDate expectedEndDate",
        populate: [
          {
            path: "client",
            select: "name email phoneNumber companyName",
          },
          {
            path: "site_manager",
            select: "name email phoneNumber profilePicture",
          },
        ],
      })
      .populate("createdBy", "name email role profilePicture");

    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found",
      });
    }

    // Get related payrolls where this advance might have been recovered
    const relatedPayrolls = await Payroll.find({
      user: advance.user._id,
      project: advance.project._id,
      advanceRecovered: { $gt: 0 },
    })
      .select("periodStart periodEnd netSalary paymentStatus advanceRecovered")
      .sort({ periodStart: -1 });

    res.status(200).json({
      success: true,
      data: advance,
      relatedPayrolls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserAdvances = async (req, res) => {
  try {
    const advances = await Advance.find({
      user: req.params.userId,
      project: req.params.projectId,
    })
      .populate("user", "name email role phoneNumber profilePicture")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email")
      .sort({ givenDate: -1 });

    const totalGiven = advances.reduce((sum, a) => sum + a.amount, 0);
    const totalRecovered = advances.reduce(
      (sum, a) => sum + a.amountRecovered,
      0,
    );
    const totalPending = totalGiven - totalRecovered;

    res.status(200).json({
      success: true,
      data: advances,
      summary: {
        totalGiven,
        totalRecovered,
        totalPending,
        advanceCount: advances.length,
        fullyRecovered: advances.filter((a) => a.recoveryStatus === "recovered")
          .length,
        partiallyRecovered: advances.filter(
          (a) => a.recoveryStatus === "partially_recovered",
        ).length,
        pending: advances.filter((a) => a.recoveryStatus === "pending").length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recoverAdvance = async (req, res) => {
  try {
    const { amountToRecover } = req.body;

    const advance = await Advance.findById(req.params.id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found",
      });
    }

    if (advance.recoveryStatus === "recovered") {
      return res.status(400).json({
        success: false,
        message: "Advance already fully recovered",
      });
    }

    const remaining = advance.amount - advance.amountRecovered;
    if (amountToRecover > remaining) {
      return res.status(400).json({
        success: false,
        message: `Cannot recover more than remaining advance amount: ₹${remaining}`,
      });
    }

    // ✅ Check against latest payroll netSalary
    const latestPayroll = await Payroll.findOne({
      user: advance.user,
      project: advance.project,
    }).sort({ createdAt: -1 });

    if (latestPayroll) {
      const alreadyRecoveredInPayroll = latestPayroll.advanceRecovered || 0;
      const maxRecoverable =
        latestPayroll.netSalary - alreadyRecoveredInPayroll;

      if (maxRecoverable <= 0) {
        return res.status(400).json({
          success: false,
          message: `No recoverable amount left in the latest payroll. Net salary ₹${latestPayroll.netSalary} is already fully used for recovery.`,
        });
      }

      if (amountToRecover > maxRecoverable) {
        return res.status(400).json({
          success: false,
          message: `Cannot recover ₹${amountToRecover}. Maximum recoverable from latest payroll (Net: ₹${latestPayroll.netSalary}) is ₹${maxRecoverable}.`,
        });
      }
    }

    // ✅ Update advance
    advance.amountRecovered += amountToRecover;
    advance.recoveryStatus =
      advance.amountRecovered >= advance.amount
        ? "recovered"
        : "partially_recovered";

    await advance.save();

    // ✅ Update advanceRecovered on the latest payroll
    if (latestPayroll) {
      latestPayroll.advanceRecovered =
        (latestPayroll.advanceRecovered || 0) + amountToRecover;
      await latestPayroll.save();
    }

    // Populate the updated advance
    const updatedAdvance = await Advance.findById(advance._id)
      .populate("user", "name email role")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Advance recovered successfully",
      data: updatedAdvance,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAdvance = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found",
      });
    }

    if (advance.recoveryStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot edit an advance that has been partially or fully recovered",
      });
    }

    const { amount, reason, givenDate } = req.body;
    if (amount !== undefined) advance.amount = amount;
    if (reason !== undefined) advance.reason = reason;
    if (givenDate !== undefined) advance.givenDate = givenDate;

    await advance.save();

    // Populate the updated advance
    const updatedAdvance = await Advance.findById(advance._id)
      .populate("user", "name email role")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name email");

    res.status(200).json({ success: true, data: updatedAdvance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAdvance = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found",
      });
    }

    if (advance.recoveryStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a recovered or partially recovered advance",
      });
    }

    await advance.deleteOne();
    res.status(200).json({
      success: true,
      message: "Advance deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectAdvanceSummary = async (req, res) => {
  try {
    const summary = await Advance.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $group: {
          _id: "$recoveryStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalRecovered: { $sum: "$amountRecovered" },
          averageAmount: { $avg: "$amount" },
        },
      },
    ]);

    // Get user-wise summary
    const userSummary = await Advance.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $group: {
          _id: "$user",
          totalAdvances: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalRecovered: { $sum: "$amountRecovered" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          "userDetails.name": 1,
          "userDetails.email": 1,
          "userDetails.role": 1,
          totalAdvances: 1,
          totalAmount: 1,
          totalRecovered: 1,
          pendingAmount: { $subtract: ["$totalAmount", "$totalRecovered"] },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Get project details
    const project = await mongoose
      .model("Project")
      .findById(req.params.projectId)
      .select("projectName siteName client site_manager")
      .populate("client", "name email")
      .populate("site_manager", "name email");

    res.status(200).json({
      success: true,
      data: {
        project,
        byStatus: summary,
        byUser: userSummary,
        totalAdvances: userSummary.reduce((sum, u) => sum + u.totalAdvances, 0),
        totalAmount: userSummary.reduce((sum, u) => sum + u.totalAmount, 0),
        totalRecovered: userSummary.reduce(
          (sum, u) => sum + u.totalRecovered,
          0,
        ),
        totalPending: userSummary.reduce((sum, u) => sum + u.pendingAmount, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadSalarySlip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: "user",
        select:
          "name email role phoneNumber profilePicture adharNumber panNumber",
      })
      .populate({
        path: "project",
        select: "projectName siteName location client site_manager",
        populate: [
          { path: "client", select: "name email phoneNumber companyName" },
          { path: "site_manager", select: "name email phoneNumber" },
        ],
      })
      .populate({
        path: "salaryStructure",
        select: "salaryType rateAmount overtimeRate effectiveFrom",
      })
      .populate("createdBy", "name email role");

    if (!payroll) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });
    }

    // Stream the PDF directly to the client
    generateSalarySlipPDF(payroll.toObject(), res);
  } catch (error) {
    // If headers not yet sent, respond with JSON error
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getProjectUsers = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // Find project and populate both site_manager and labour fields
    const project = await projectModel
      .findById(projectId)
      .populate({
        path: "site_manager",
        select: "name email phone role profileImage",
      })
      .populate({
        path: "labour",
        select: "name email phone role profileImage",
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const allUsers = [];
    if (project.site_manager) {
      allUsers.push({
        ...project.site_manager.toObject(),
        userType: "site_manager",
      });
    }

    if (project.labour && project.labour.length > 0) {
      const labourUsers = project.labour.map((labour) => ({
        ...labour.toObject(),
        userType: "labour",
      }));
      allUsers.push(...labourUsers);
    }

    return res.status(200).json({
      success: true,
      message: "Project users fetched successfully",
      data: {
        site_manager: project.site_manager || null,
        labour: project.labour || [],
        allUsers: allUsers,
        totalUsers: allUsers.length,
      },
    });
  } catch (error) {
    console.error("🔥 Get Project Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project users",
      error: error.message,
    });
  }
};
