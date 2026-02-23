import mongoose from "mongoose";
const locationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
  },
  { _id: false },
);

const phaseSchema = new mongoose.Schema(
  {
    phaseName: {
      type: String,
      enum: ["FOUNDATION", "STRUCTURE", "FINISHING", "HANDOVER"],
      required: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    siteName: {
      type: String,
      required: true,
      trim: true,
    },
     area: {
      type: Number,
      required: true,
      min: 0,
      description: "Area in square feet/meters",
    },


    location: locationSchema,

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    site_manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    labour: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    AttributeSet: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttributeSet",
        required: true,
      },
    ],
    attributes: [
      {
        attribute: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attribute",
        },
        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
      },
    ],

    startDate: {
      type: Date,
      required: true,
    },

    expectedEndDate: {
      type: Date,
      validate: {
        validator(value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    extracost: {
      type: Number,
      required: true,
      min: 0,
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    projectStatus: {
      type: String,
      enum: ["planning", "in_progress", "on_hold", "completed"],
      default: "planning",
    },

    phases: {
      type: [phaseSchema],
      default: [],
    },

    documents: {
      type: [documentSchema],
      default: [],
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);
projectSchema.index({ projectName: 1 });
projectSchema.index({ siteStatus: 1 });
projectSchema.index({ approvalStatus: 1 });

export default mongoose.model("Project", projectSchema);
