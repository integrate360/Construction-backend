import mongoose from "mongoose";

const attendanceLocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      index: "2dsphere",
    },
  },
  { _id: false },
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

    selfieImage: {
      type: String,
      required: true,
    },

    location: {
      type: attendanceLocationSchema,
      required: true,
    },

    attendanceType: {
      type: String,
      enum: ["check_in", "check_out"],
      required: true,
    },

    attendanceDate: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    status: {
      type: String,
      enum: ["present", "rejected"],
      default: "present",
    },

    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index(
  { user: 1, project: 1, attendanceDate: 1, attendanceType: 1 },
  { unique: true },
);

export default mongoose.model("Attendance", attendanceSchema);
