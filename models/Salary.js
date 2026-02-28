import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    role: {
      type: String,
      enum: ["site_manager", "labour"],
      required: true,
    },
    salaryType: {
      type: String,
      enum: ["daily", "monthly", "hourly"],
      required: true,
    },
    rateAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
      min: 0,
      description: "Extra pay per hour for overtime",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
const deductionSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      enum: ["absence", "advance_recovery", "penalty", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const allowanceSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      enum: ["bonus", "travel", "food", "overtime", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const payrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
      required: true,
    },
    role: {
      type: String,
      enum: ["site_manager", "labour"],
      required: true,
    },

    // Period
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    // Attendance summary (auto-calculated from Attendance model)
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },

    // Financials
    basicSalary: { type: Number, required: true, min: 0 }, // based on present days × rate
    overtimePay: { type: Number, default: 0, min: 0 },
    allowances: { type: [allowanceSchema], default: [] },
    deductions: { type: [deductionSchema], default: [] },

    totalAllowances: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 }, // basicSalary + overtimePay + totalAllowances
    netSalary: { type: Number, default: 0 }, // grossSalary - totalDeductions

    // Advance tracking
    advancePaid: { type: Number, default: 0 },
    advanceRecovered: { type: Number, default: 0 },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "partially_paid", "paid"],
      default: "pending",
    },
    paymentDate: { type: Date },
    paymentMode: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "cheque"],
    },
    transactionReference: { type: String, trim: true },

    remarks: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const advanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
    givenDate: { type: Date, default: Date.now },
    recoveryStatus: {
      type: String,
      enum: ["pending", "partially_recovered", "recovered"],
      default: "pending",
    },
    amountRecovered: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
payrollSchema.index({ user: 1, project: 1, periodStart: 1 });
salaryStructureSchema.index({ user: 1, project: 1, isActive: 1 });
advanceSchema.index({ user: 1, project: 1, recoveryStatus: 1 });

export const SalaryStructure = mongoose.model(
  "SalaryStructure",
  salaryStructureSchema,
);
export const Payroll = mongoose.model("Payroll", payrollSchema);
export const Advance = mongoose.model("Advance", advanceSchema);
