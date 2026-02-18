import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "cement",
      "sand",
      "aggregate",
      "steel",
      "brick",
      "block",
      "concrete",
      "wood",
      "plywood",
      "tiles",
      "marble",
      "granite",
      "paint",
      "electrical",
      "plumbing",
      "sanitary",
      "glass",
      "aluminium",
      "hardware",
      "chemicals",
      "waterproofing",
      "adhesive",
      "flooring",
      "roofing",
      "false_ceiling",
      "fixtures",
      "tools",
      "miscellaneous",
    ],
  },

  pricing: {
    type: Number,
    default: 0,
  },
});

const Attribute = mongoose.model("Attribute", attributeSchema);
export default Attribute;
