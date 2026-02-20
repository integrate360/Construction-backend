import Attribute from "../models/Attribute.js";


export const createAttribute = async (req, res) => {
  try {
    console.log("👉 Create Attribute User:", {
      id: req.user._id,
      role: req.user.role,
    });

    const { label, type, pricing } = req.body;

    const attribute = await Attribute.create({
      label,
      type,
      pricing,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Attribute created successfully",
      data: attribute,
    });
  } catch (error) {
    console.error("🔥 createAttribute error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAttributes = async (req, res) => {
  try {
    console.log("👉 getAllAttributes called");
    console.log("👤 User ID:", req.user._id);
    console.log("🔑 User Role:", req.user.role);

    let filter = {};

    // super_admin → only own records
    if (req.user.role === "super_admin") {
      filter.createdBy = req.user._id;
      console.log("🔍 Applied filter: createdBy =", req.user._id);
    }

    // saas_admin → no filter (full access)
    if (req.user.role === "saas_admin") {
      console.log("🔓 saas_admin detected → full access");
    }

    const attributes = await Attribute.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    console.log("📦 Total attributes found:", attributes.length);

    res.status(200).json({
      success: true,
      count: attributes.length,
      data: attributes,
    });
  } catch (error) {
    console.error("🔥 getAllAttributes error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attributes",
    });
  }
};

export const getAttributeById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("👉 getAttributeById called");
    console.log("🆔 Attribute ID:", id);
    console.log("👤 User ID:", req.user._id);
    console.log("🔑 User Role:", req.user.role);

    const attribute = await Attribute.findById(id).populate(
      "createdBy",
      "name email role"
    );

    if (!attribute) {
      console.warn("⚠️ Attribute not found");
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    console.log("✅ Attribute found");
    console.log("👨‍💼 Created By:", attribute.createdBy._id.toString());

    // super_admin → only own attribute
    if (req.user.role === "super_admin") {
      if (attribute.createdBy._id.toString() !== req.user._id.toString()) {
        console.warn("⛔ Access denied: Not owner");

        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this attribute",
        });
      }
    }

    // saas_admin → full access
    console.log("🔓 Access granted");

    res.status(200).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    console.error("🔥 getAttributeById error:", error);

    res.status(400).json({
      success: false,
      message: "Invalid Attribute ID",
    });
  }
};

export const updateAttribute = async (req, res) => {
  try {
    console.log("👉 Update Attribute ID:", req.params.id);

    const attribute = await Attribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    // Permission check
    if (req.user.role !== "saas_admin") {
      if (attribute.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this attribute",
        });
      }
    }

    const { label, type, pricing } = req.body;

    attribute.label = label ?? attribute.label;
    attribute.type = type ?? attribute.type;
    attribute.pricing = pricing ?? attribute.pricing;

    await attribute.save();

    res.status(200).json({
      success: true,
      message: "Attribute updated successfully",
      data: attribute,
    });
  } catch (error) {
    console.error("🔥 updateAttribute error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAttribute = async (req, res) => {
  try {
    console.log("👉 Delete Attribute ID:", req.params.id);

    const attribute = await Attribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    // Permission check
    if (req.user.role !== "saas_admin") {
      if (attribute.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to delete this attribute",
        });
      }
    }

    await attribute.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attribute deleted successfully",
    });
  } catch (error) {
    console.error("🔥 deleteAttribute error:", error);
    res.status(400).json({
      success: false,
      message: "Invalid Attribute ID",
    });
  }
};