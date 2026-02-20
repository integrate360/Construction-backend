import mongoose from "mongoose";

const PhaseSchema = new mongoose.Schema(
  {
    phaseNumber: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    phaseName: {
      type: String,
      required: true,
      enum: ["FOUNDATION", "STRUCTURE", "FINISHING", "HANDOVER"],
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    costsIncurred: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeSpentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    notes: String,
  },
  { _id: false },
);

/* ---------------- Project Schema ---------------- */
const ProjectSchema = new Schema(
  {
    /* ---------- Client ---------- */
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
        attributeSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttributeSet",
    },

    /* ---------- Site Information ---------- */
    siteInfo: {
      siteName: { type: String, trim: true },
      address: String,
      city: String,
      state: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
      landAreaSqFt: { type: Number, min: 0 },
      builtUpAreaSqFt: { type: Number, min: 0 }
    },
    area: String,
    type: {
      type: String,
      enum: ["residential", "commercial", "industrial", "infrastructure"],
      required: true,
    },

    /* ---------- Professionals ---------- */
    architectName: String,
    structuralEngineer: String,
    contractorName: String,
    consultantName: String,

    /* ---------- Approvals ---------- */
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvals: {
      buildingPlan: { type: Boolean, default: false },
      environmentalClearance: { type: Boolean, default: false },
      fireSafety: { type: Boolean, default: false },
      commencementCertificate: { type: Boolean, default: false },
      occupancyCertificate: { type: Boolean, default: false },
    },

    /* ---------- Utilities ---------- */
    utilities: {
      electricity: { type: Boolean, default: false },
      waterSupply: { type: Boolean, default: false },
      drainage: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
    },

    /* ---------- Financials ---------- */
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    boqValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedCost: {
      type: Number,
      min: 0,
    },
    actualCost: {
      type: Number,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "bank"],
    },

    /* ---------- Timeline ---------- */
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    expectedCompletionDate: Date,

    /* ---------- Progress ---------- */
    currentPhase: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["planning", "active", "on_hold", "completed", "cancelled"],
      default: "planning",
    },

    phases: {
      type: [PhaseSchema],
      default: [],
    },

    /* ---------- Team ---------- */
    siteManagers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ---------- Misc ---------- */
    risks: {
      type: [String],
      default: [],
    },
    remarks: String,
    location: String,
  },
  { timestamps: true },
);

/* ---------------- Methods ---------------- */
ProjectSchema.methods.calculateCompletion = function () {
  if (!this.phases.length) return 0;

  const total = this.phases.reduce(
    (sum, phase) => sum + (phase.completionPercentage || 0),
    0,
  );

  return Math.round(total / this.phases.length);
};

export default model("Project", ProjectSchema);
