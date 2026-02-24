import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    attendanceType: {
      type: String,
      enum: ["check-in", "check-out"],
      required: true,
    },

    selfieImage: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], 
        required: true,
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true } // Changed from false to true to enable automatic IDs
);

const attendanceSchema = new mongoose.Schema(
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

    history: [historySchema],
  },
  { timestamps: true }
);

// Optional but useful
attendanceSchema.index({ "history.location": "2dsphere" });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;