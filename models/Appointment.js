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

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    reminderTime: {
      type: Date,
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
        type: String, // emails or names
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

    color: {
      type: String,
      default: "#3788d8",
    },

    recurrenceRule: {
      type: String,
    },

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

// Indexes
AppointmentSchema.index({ startTime: 1, endTime: 1 });
AppointmentSchema.index({ status: 1, startTime: 1 });
AppointmentSchema.index({ createdBy: 1, startTime: 1 });

export default mongoose.model("Appointment", AppointmentSchema);
