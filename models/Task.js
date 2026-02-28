import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "carried_forward", "overdue"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
    },
    completionNotes: {
      type: String,
      trim: true,
    },
    originalTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      description: "Reference to original task if this is a carried forward task",
    },
    carryForwardCount: {
      type: Number,
      default: 0,
      description: "Number of times this task has been carried forward",
    },
    lastCarryForwardDate: {
      type: Date,
    },
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });
taskSchema.index({ priority: 1, dueDate: 1 });
taskSchema.index({ status: 1, dueDate: 1 }); // For auto carry-forward queries

// Method to mark task as completed
taskSchema.methods.markAsCompleted = async function(notes, completedBy) {
  this.status = "completed";
  this.completedDate = new Date();
  if (notes) this.completionNotes = notes;
  if (completedBy) this.completedBy = completedBy;
  await this.save();
  return this;
};

// Method to carry forward task
taskSchema.methods.carryForward = async function(newDueDate, priority = "high") {
  // Create a new task based on current one
  const Task = mongoose.model("Task");
  const carriedTask = new Task({
    title: this.title,
    description: this.description,
    project: this.project,
    assignedBy: this.assignedBy,
    assignedTo: this.assignedTo,
    priority: priority,
    status: "carried_forward",
    dueDate: newDueDate,
    originalTask: this._id,
    carryForwardCount: this.carryForwardCount + 1,
    lastCarryForwardDate: new Date(),
    attachments: this.attachments,
  });
  
  // Update original task status
  this.status = "carried_forward";
  await this.save();
  
  return await carriedTask.save();
};

// Static method to check and carry forward overdue tasks
taskSchema.statics.carryForwardOverdueTasks = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Find all pending or in_progress tasks that are overdue
  const overdueTasks = await this.find({
    status: { $in: ["pending", "in_progress"] },
    dueDate: { $lt: today },
    isActive: true
  }).populate('project assignedTo');
  
  const carriedTasks = [];
  const taskGroupsByProject = {};
  
  for (const task of overdueTasks) {
    // Mark current task as overdue
    task.status = "overdue";
    await task.save();
    
    // Carry forward to tomorrow
    const carriedTask = await task.carryForward(tomorrow, task.priority);
    carriedTasks.push(carriedTask);
    
    // Group for daily summary updates
    task.assignedTo.forEach(labourId => {
      const key = `${labourId}_${task.project}`;
      if (!taskGroupsByProject[key]) {
        taskGroupsByProject[key] = {
          labourId: labourId,
          projectId: task.project,
          tasks: []
        };
      }
      taskGroupsByProject[key].tasks.push(task);
    });
  }
  
  return {
    carriedTasks,
    taskGroupsByProject,
    count: carriedTasks.length
  };
};

const Task = mongoose.model("Task", taskSchema);
export default Task;