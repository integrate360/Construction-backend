import AttributeSet from "../models/AttributeSet.js";

export const createAttributeSet = async (req, res) => {
  try {
    const { name, attributes } = req.body;

    const attributeSet = await AttributeSet.create({
      name,
      attributes,
    });

    res.status(201).json({
      success: true,
      message: "Attribute set created successfully",
      data: attributeSet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- Get All Attribute Sets ---------------- */
export const getAllAttributeSets = async (req, res) => {
  try {
    const attributeSets = await AttributeSet.find()
      .populate("attributes")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attributeSets.length,
      data: attributeSets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- Get Attribute Set By ID ---------------- */
export const getAttributeSetById = async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findById(req.params.id).populate(
      "attributes"
    );

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    res.status(200).json({
      success: true,
      data: attributeSet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Attribute Set ID",
    });
  }
};

/* ---------------- Update Attribute Set ---------------- */
export const updateAttributeSet = async (req, res) => {
  try {
    const { name, attributes } = req.body;

    const attributeSet = await AttributeSet.findByIdAndUpdate(
      req.params.id,
      { name, attributes },
      { new: true, runValidators: true }
    ).populate("attributes");

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attribute set updated successfully",
      data: attributeSet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteAttributeSet = async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findByIdAndDelete(req.params.id);

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attribute set deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Attribute Set ID",
    });
  }
};
