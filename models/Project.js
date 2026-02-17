import mongoose from "mongoose";

const PhaseSchema = new mongoose.Schema({
  phaseNumber: { type: Number, required: true, enum: [1, 2, 3, 4] },
  phaseName: {
    type: String,
    enum: ["FOUNDATION", "STRUCTURE", "FINISHING", "HANDOVER"],
    required: true,
  },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  costsIncurred: { type: Number, default: 0 },
  timeSpentDays: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed"],
    default: "pending",
  },
  notes: { type: String },
});

const ProjectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    totalBudget: { type: Number, required: [true, "Budget is required"] },
    boqValue: { type: Number, default: 0 },
    area: { type: String },
    type: {
      type: String,
      enum: ["residential", "commercial", "industrial", "infrastructure"],
    },
    architectName: { type: String },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    planningDetails: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    currentPhase: { type: Number, enum: [1, 2, 3, 4], default: 1 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["planning", "active", "on_hold", "completed", "cancelled"],
      default: "planning",
    },
    phases: [PhaseSchema],
    siteManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    location: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

ProjectSchema.methods.calculateCompletion = function () {
  if (!this.phases || this.phases.length === 0) return 0;
  const total = this.phases.reduce((sum, p) => sum + p.completionPercentage, 0);
  return Math.round(total / this.phases.length);
};

const Project = mongoose.model("Project", ProjectSchema);
export default Project;
