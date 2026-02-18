import Attribute from "../models/Attribute.js";

export const createAttribute = async (req, res) => {
  try {
    const { label, type, pricing } = req.body;

    const attribute = await Attribute.create({
      label,
      type,
      pricing,
    });

    res.status(201).json({
      success: true,
      message: "Attribute created successfully",
      data: attribute,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attributes.length,
      data: attributes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAttributeById = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.status(200).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Attribute ID",
    });
  }
};

export const updateAttribute = async (req, res) => {
  try {
    const { label, type, pricing } = req.body;

    const attribute = await Attribute.findByIdAndUpdate(
      req.params.id,
      { label, type, pricing },
      { new: true, runValidators: true },
    );

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attribute updated successfully",
      data: attribute,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findByIdAndDelete(req.params.id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attribute deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Attribute ID",
    });
  }
};
