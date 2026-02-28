import mongoose from "mongoose";

const dailyTaskSummarySchema = new mongoose.Schema(
  {
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalTasksAssigned: {
      type: Number,
      default: 0,
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
    },
    totalTasksPending: {
      type: Number,
      default: 0,
    },
    totalTasksOverdue: {
      type: Number,
      default: 0,
    },
    tasksCarriedForward: {
      type: Number,
      default: 0,
    },
    completedTaskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    pendingTaskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    overdueTaskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    carriedForwardTaskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique labour-project-date combination
dailyTaskSummarySchema.index({ labour: 1, project: 1, date: 1 }, { unique: true });

// Method to update summary with completed task
dailyTaskSummarySchema.methods.addCompletedTask = async function(taskId) {
  if (!this.completedTaskIds.includes(taskId)) {
    this.completedTaskIds.push(taskId);
    this.totalTasksCompleted = this.completedTaskIds.length;
    
    // Remove from pending if present
    const pendingIndex = this.pendingTaskIds.indexOf(taskId);
    if (pendingIndex > -1) {
      this.pendingTaskIds.splice(pendingIndex, 1);
      this.totalTasksPending = this.pendingTaskIds.length;
    }
    
    // Remove from overdue if present
    const overdueIndex = this.overdueTaskIds.indexOf(taskId);
    if (overdueIndex > -1) {
      this.overdueTaskIds.splice(overdueIndex, 1);
      this.totalTasksOverdue = this.overdueTaskIds.length;
    }
    
    await this.save();
  }
  return this;
};

const DailyTaskSummary = mongoose.model("DailyTaskSummary", dailyTaskSummarySchema);
export default DailyTaskSummary;