import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
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

    location: {
      type: String,
      trim: true,
    },

    // Using startTime and endTime to match Swagger
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return value > this.startTime;
        },
        message: "End time must be after start time",
      },
    },

    reminderTime: {
      type: Date,
      validate: {
        validator(value) {
          return !value || value < this.startTime;
        },
        message: "Reminder time must be before start time",
      },
    },

    notes: {
      type: String,
      trim: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },

    attendees: [
      {
        type: String, // Store emails or names
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    
    // For calendar color coding
    color: {
      type: String,
      default: "#3788d8",
    },
    
    // For recurring appointments
    recurrenceRule: {
      type: String, // RRULE format
    },
    
    // Original appointment ID if this is a rescheduled version
    originalAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for efficient calendar queries
AppointmentSchema.index({ startTime: 1, endTime: 1 });
AppointmentSchema.index({ status: 1, startTime: 1 });
AppointmentSchema.index({ createdBy: 1, startTime: 1 });

export default mongoose.model("Appointment", AppointmentSchema);