import AttributeSet from "../models/AttributeSet.js";

export const createAttributeSet = async (req, res) => {
  try {
    const { name, attributes } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one attribute is required",
      });
    }

    // Validate each attribute has required fields including quantity
    for (let i = 0; i < attributes.length; i++) {
      const item = attributes[i];

      if (!item.attribute) {
        return res.status(400).json({
          success: false,
          message: `Attribute ${i + 1}: attribute ID is required`,
        });
      }

      // Check if quantity is provided and valid
      if (item.quantity === undefined || item.quantity === null) {
        return res.status(400).json({
          success: false,
          message: `Attribute ${i + 1}: quantity is required`,
        });
      }

      if (typeof item.quantity !== "number" || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Attribute ${i + 1}: quantity must be a number greater than or equal to 1`,
        });
      }
    }

    // Create attribute set with proper structure
    const attributeSet = await AttributeSet.create({
      name,
      attributes: attributes.map((item) => ({
        attribute: item.attribute,
        quantity: item.quantity, // Ensure quantity is included
      })),
      createdBy: req.user._id,
    });

    // Populate the response to show attribute details
    const populatedSet = await AttributeSet.findById(attributeSet._id)
      .populate({
        path: "attributes.attribute",
        model: "Attribute",
        select: "name value type", // Select only needed fields
      })
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Attribute set created successfully",
      data: populatedSet,
    });
  } catch (error) {
    console.error("🔥 createAttributeSet error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
      .populate({
        path: "attributes",
        populate: {
          path: "attribute",
          model: "Attribute"
        }
      })
      .populate("createdBy")
      .sort({ createdAt: -1 });

    // Calculate total value for each attribute set
    const attributeSetsWithTotal = attributeSets.map(set => {
      // Convert to plain object if it's a Mongoose document
      const setObj = set.toObject ? set.toObject() : set;
      
      // Calculate total by summing (quantity * attribute.pricing)
      let setTotal = 0;
      
      if (setObj.attributes && Array.isArray(setObj.attributes)) {
        setObj.attributes.forEach(item => {
          if (item.attribute && item.attribute.pricing && item.quantity) {
            const itemTotal = item.quantity * item.attribute.pricing;
            setTotal += itemTotal;
          }
        });
      }
      
      // Add the calculated total to the response
      return {
        ...setObj,
        setTotal: setTotal
      };
    });

    res.status(200).json({
      success: true,
      count: attributeSetsWithTotal.length,
      data: attributeSetsWithTotal,
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
      .populate({
        path: "attributes",
        populate: {
          path: "attribute",
          model: "Attribute"
        }
      })
      .populate("createdBy");

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: "Attribute set not found",
      });
    }

    // Permission check
    if (req.user.role !== "saas_admin") {
      if (attributeSet.createdBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this attribute set",
        });
      }
    }

    // Calculate total value
    const setObj = attributeSet.toObject ? attributeSet.toObject() : attributeSet;
    
    let setTotal = 0;
    let validAttributes = 0;
    
    if (setObj.attributes && Array.isArray(setObj.attributes)) {
      setObj.attributes.forEach(item => {
        if (item.attribute && item.attribute.pricing && item.quantity) {
          const itemTotal = item.quantity * item.attribute.pricing;
          setTotal += itemTotal;
          validAttributes++;
          
          // Add item total to the response for frontend use
          item.itemTotal = itemTotal;
        } else {
          item.itemTotal = 0;
          item.isValid = false;
        }
      });
    }

    // Add calculated fields to response
    const responseData = {
      ...setObj,
      setTotal: setTotal,
      validAttributes: validAttributes,
      totalAttributes: setObj.attributes?.length || 0,
      attributeCount: setObj.attributes?.length || 0
    };

    res.status(200).json({
      success: true,
      data: responseData,
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

    // Update name if provided
    if (name !== undefined) {
      attributeSet.name = name;
    }

    // Update attributes if provided with validation
    if (attributes !== undefined) {
      // Validate that attributes is an array
      if (!Array.isArray(attributes)) {
        return res.status(400).json({
          success: false,
          message: "Attributes must be an array",
        });
      }

      // Validate that array is not empty
      if (attributes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Attributes array cannot be empty",
        });
      }

      // Validate each attribute has required fields including quantity
      for (let i = 0; i < attributes.length; i++) {
        const item = attributes[i];

        if (!item.attribute) {
          return res.status(400).json({
            success: false,
            message: `Attribute ${i + 1}: attribute ID is required`,
          });
        }

        // Check if quantity is provided and valid
        if (item.quantity === undefined || item.quantity === null) {
          return res.status(400).json({
            success: false,
            message: `Attribute ${i + 1}: quantity is required`,
          });
        }

        if (typeof item.quantity !== "number" || item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message: `Attribute ${i + 1}: quantity must be a number greater than or equal to 1`,
          });
        }

        // Validate attribute ID format
        if (!mongoose.Types.ObjectId.isValid(item.attribute)) {
          return res.status(400).json({
            success: false,
            message: `Attribute ${i + 1}: invalid attribute ID format`,
          });
        }
      }

      // Update attributes with proper structure
      attributeSet.attributes = attributes.map((item) => ({
        attribute: item.attribute,
        quantity: item.quantity, // Ensure quantity is included
      }));
    }

    await attributeSet.save();

    // Populate the response to show updated attribute details
    const updatedSet = await AttributeSet.findById(attributeSet._id)
      .populate({
        path: "attributes.attribute",
        model: "Attribute",
        select: "name value type", // Select only needed fields
      })
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Attribute set updated successfully",
      data: updatedSet,
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
