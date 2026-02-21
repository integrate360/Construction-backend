import mongoose from "mongoose";

const attributeSetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    attributes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attribute",
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AttributeSet = mongoose.model("AttributeSet", attributeSetSchema);
export default AttributeSet;