import mongoose from "mongoose";

const attributeSetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attribute" }],
});

const AttributeSet = mongoose.model("AttributeSet", attributeSetSchema);
export default AttributeSet;
