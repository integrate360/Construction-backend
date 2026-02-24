import mongoose from "mongoose";
import { Payroll, SalaryStructure, Advance } from "../models/Salary.js";
import { calcPayroll, getAttendanceSummary } from "../helpers/Payrollhelper.js";

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

    res.status(201).json({ success: true, data: structure });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllSalaryStructures = async (req, res) => {
  try {
    const { project, user, role, isActive } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const structures = await SalaryStructure.find(filter)
      .populate("user", "name email role phoneNumber")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: structures.length, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalaryStructureById = async (req, res) => {
  try {
    const structure = await SalaryStructure.findById(req.params.id)
      .populate("user", "name email role")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name");

    if (!structure)
      return res
        .status(404)
        .json({ success: false, message: "Salary structure not found" });

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
    );

    if (!structure)
      return res
        .status(404)
        .json({ success: false, message: "Salary structure not found" });

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

    if (!structure)
      return res
        .status(404)
        .json({ success: false, message: "Salary structure not found" });

    res.status(200).json({
      success: true,
      message: "Salary structure deactivated",
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
      .populate("user", "name email role")
      .populate("project", "projectName siteName");

    if (!structure)
      return res
        .status(404)
        .json({ success: false, message: "No active salary structure found" });

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
    if (exists)
      return res.status(400).json({
        success: false,
        message: "Payroll already generated for this period",
      });

    // Get active salary structure
    const structure = await SalaryStructure.findOne({
      user,
      project,
      isActive: true,
    });
    if (!structure)
      return res.status(404).json({
        success: false,
        message:
          "No active salary structure found for this user on this project",
      });

    // Get attendance summary
    const { presentDays, absentDays, totalWorkingDays } =
      await getAttendanceSummary(user, project, periodStart, periodEnd);

    // Get pending advances for reference
    const pendingAdvances = await Advance.find({
      user,
      project,
      recoveryStatus: { $ne: "recovered" },
    });
    const totalAdvancePaid = pendingAdvances.reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    const totalAdvanceRecovered = pendingAdvances.reduce(
      (sum, a) => sum + a.amountRecovered,
      0,
    );

    const {
      basicSalary,
      overtimePay,
      totalAllowances,
      totalDeductions,
      grossSalary,
      netSalary,
    } = calcPayroll(
      structure,
      presentDays,
      overtimeHours,
      allowances,
      deductions,
    );

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
      advanceRecovered: totalAdvanceRecovered,
      remarks,
      createdBy: req.user.id,
    });

    await payroll.populate(["user", "project", "salaryStructure"]);

    res.status(201).json({ success: true, data: payroll });
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

    const structures = await SalaryStructure.find({ project, isActive: true });
    if (!structures.length)
      return res.status(404).json({
        success: false,
        message: "No active salary structures found for this project",
      });

    const results = { success: [], failed: [] };

    for (const structure of structures) {
      try {
        const exists = await Payroll.findOne({
          user: structure.user,
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
            structure.user,
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
          user: structure.user,
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

        results.success.push({ user: structure.user, payrollId: payroll._id });
      } catch (err) {
        results.failed.push({ user: structure.user, reason: err.message });
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllPayrolls = async (req, res) => {
  try {
    const { project, user, role, paymentStatus, periodStart, periodEnd } =
      req.query;
    const filter = {};
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (role) filter.role = role;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (periodStart) filter.periodStart = { $gte: new Date(periodStart) };
    if (periodEnd) filter.periodEnd = { $lte: new Date(periodEnd) };

    const payrolls = await Payroll.find(filter)
      .populate("user", "name email role phoneNumber")
      .populate("project", "projectName siteName")
      .populate("salaryStructure", "salaryType rateAmount")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: payrolls.length, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("user", "name email role phoneNumber profilePicture")
      .populate("project", "projectName siteName location")
      .populate("salaryStructure")
      .populate("createdBy", "name");

    if (!payroll)
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });

    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll)
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });

    if (payroll.paymentStatus === "paid")
      return res
        .status(400)
        .json({ success: false, message: "Cannot update a paid payroll" });

    const { allowances, deductions, overtimeHours, remarks } = req.body;

    if (allowances !== undefined) payroll.allowances = allowances;
    if (deductions !== undefined) payroll.deductions = deductions;
    if (overtimeHours !== undefined) payroll.overtimeHours = overtimeHours;
    if (remarks !== undefined) payroll.remarks = remarks;

    // Recalculate financials
    const structure = await SalaryStructure.findById(payroll.salaryStructure);
    if (!structure)
      return res
        .status(404)
        .json({ success: false, message: "Linked salary structure not found" });

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
    res.status(200).json({ success: true, data: payroll });
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
      .populate("user", "name email")
      .populate("project", "projectName");

    if (!payroll)
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });

    res.status(200).json({
      success: true,
      message: "Payroll marked as paid",
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
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll)
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });

    if (payroll.paymentStatus !== "pending")
      return res.status(400).json({
        success: false,
        message: "Only pending payrolls can be deleted",
      });

    await payroll.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Payroll deleted successfully" });
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

    res.status(201).json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllAdvances = async (req, res) => {
  try {
    const { project, user, recoveryStatus } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (user) filter.user = user;
    if (recoveryStatus) filter.recoveryStatus = recoveryStatus;

    const advances = await Advance.find(filter)
      .populate("user", "name email role phoneNumber")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name")
      .sort({ givenDate: -1 });

    res
      .status(200)
      .json({ success: true, count: advances.length, data: advances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdvanceById = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id)
      .populate("user", "name email role phoneNumber")
      .populate("project", "projectName siteName")
      .populate("createdBy", "name");

    if (!advance)
      return res
        .status(404)
        .json({ success: false, message: "Advance not found" });

    res.status(200).json({ success: true, data: advance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserAdvances = async (req, res) => {
  try {
    const advances = await Advance.find({
      user: req.params.userId,
      project: req.params.projectId,
    }).sort({ givenDate: -1 });

    const totalGiven = advances.reduce((sum, a) => sum + a.amount, 0);
    const totalRecovered = advances.reduce(
      (sum, a) => sum + a.amountRecovered,
      0,
    );
    const totalPending = totalGiven - totalRecovered;

    res.status(200).json({
      success: true,
      data: advances,
      summary: { totalGiven, totalRecovered, totalPending },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recoverAdvance = async (req, res) => {
  try {
    const { amountToRecover } = req.body;
    const advance = await Advance.findById(req.params.id);

    if (!advance)
      return res
        .status(404)
        .json({ success: false, message: "Advance not found" });

    if (advance.recoveryStatus === "recovered")
      return res
        .status(400)
        .json({ success: false, message: "Advance already fully recovered" });

    const remaining = advance.amount - advance.amountRecovered;
    if (amountToRecover > remaining)
      return res.status(400).json({
        success: false,
        message: `Cannot recover more than remaining amount: ₹${remaining}`,
      });

    advance.amountRecovered += amountToRecover;
    advance.recoveryStatus =
      advance.amountRecovered >= advance.amount
        ? "recovered"
        : "partially_recovered";

    await advance.save();
    res.status(200).json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAdvance = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id);
    if (!advance)
      return res
        .status(404)
        .json({ success: false, message: "Advance not found" });

    if (advance.recoveryStatus !== "pending")
      return res.status(400).json({
        success: false,
        message:
          "Cannot edit an advance that has been partially or fully recovered",
      });

    const { amount, reason, givenDate } = req.body;
    if (amount !== undefined) advance.amount = amount;
    if (reason !== undefined) advance.reason = reason;
    if (givenDate !== undefined) advance.givenDate = givenDate;

    await advance.save();
    res.status(200).json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAdvance = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id);
    if (!advance)
      return res
        .status(404)
        .json({ success: false, message: "Advance not found" });

    if (advance.recoveryStatus !== "pending")
      return res.status(400).json({
        success: false,
        message: "Cannot delete a recovered or partially recovered advance",
      });

    await advance.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Advance deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectAdvanceSummary = async (req, res) => {
  try {
    const summary = await Advance.aggregate([
      {
        $match: { project: new mongoose.Types.ObjectId(req.params.projectId) },
      },
      {
        $group: {
          _id: "$recoveryStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalRecovered: { $sum: "$amountRecovered" },
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
