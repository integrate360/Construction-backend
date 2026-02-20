import AttributeSet from "../models/AttributeSet.js";

/**
 * CREATE ATTRIBUTE SET
 */
export const createAttributeSet = async (req, res) => {
  try {
    const { name, attributes } = req.body;

    const attributeSet = await AttributeSet.create({
      name,
      attributes,
      createdBy: req.user._id, // ✅ important
    });

    res.status(201).json({
      success: true,
      message: "Attribute set created successfully",
      data: attributeSet,
    });
  } catch (error) {
    console.error("🔥 createAttributeSet error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET ALL ATTRIBUTE SETS
 */
export const getAllAttributeSets = async (req, res) => {
  try {
    console.log("👉 Get AttributeSets User:", {
      id: req.user._id,
      role: req.user.role,
    });

    let filter = {};

    // saas_admin → all
    if (req.user.role !== "saas_admin") {
      filter.createdBy = req.user._id;
    }

    const attributeSets = await AttributeSet.find(filter)
      .populate("attributes")
       .populate(
      "createdBy"
    )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attributeSets.length,
      data: attributeSets,
    });
  } catch (error) {
    console.error("🔥 getAllAttributeSets error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET ATTRIBUTE SET BY ID
 */
export const getAttributeSetById = async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findById(req.params.id)
    .populate(
      "attributes"
    )
    .populate(
      "createdBy"
    );

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    // Permission check
    if (req.user.role !== "saas_admin") {
      if (attributeSet.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this attribute set",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: attributeSet,
    });
  } catch (error) {
    console.error("🔥 getAttributeSetById error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE ATTRIBUTE SET
 */
export const updateAttributeSet = async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findById(req.params.id);

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    // Permission check
    if (req.user.role !== "saas_admin") {
      if (attributeSet.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this attribute set",
        });
      }
    }

    const { name, attributes } = req.body;

    attributeSet.name = name ?? attributeSet.name;
    attributeSet.attributes = attributes ?? attributeSet.attributes;

    await attributeSet.save();

    res.status(200).json({
      success: true,
      message: "Attribute set updated successfully",
      data: attributeSet,
    });
  } catch (error) {
    console.error("🔥 updateAttributeSet error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE ATTRIBUTE SET
 */
export const deleteAttributeSet = async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findById(req.params.id);

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    // Permission check
    if (req.user.role !== "saas_admin") {
      if (attributeSet.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to delete this attribute set",
        });
      }
    }

    await attributeSet.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attribute set deleted successfully",
    });
  } catch (error) {
    console.error("🔥 deleteAttributeSet error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};