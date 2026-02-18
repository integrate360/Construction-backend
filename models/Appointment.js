import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    meetingTime: {
      type: Date,
      required: true,
      index: true,
    },

    reminderTime: {
      type: Date,
      validate: {
        validator(value) {
          return !value || value < this.meetingTime;
        },
        message: "Reminder time must be before meeting time",
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AppointmentSchema.index({ meetingTime: 1, status: 1 });

export default mongoose.model("Appointment", AppointmentSchema);
