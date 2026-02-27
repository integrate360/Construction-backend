import mongoose from "mongoose";

const PhotosSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    photos: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },

        cloudinaryId: {
          type: String,
          trim: true,
        },

        isApproved: {
          type: Boolean,
          default: false,
        },

        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        approvedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Photos = mongoose.model("Photos", PhotosSchema);

export default Photos;