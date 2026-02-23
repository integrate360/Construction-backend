import Project from "../models/Project.js";
import User from "../models/User.js";
import AttributeSet from "../models/AttributeSet.js";
import Attribute from "../models/Attribute.js";
import mongoose from "mongoose";
import {
  isAdmin,
  isGlobalAdmin,
  canAccessProject,
  buildRoleFilter,
} from "../helpers/roleHelper.js";

export const createProject = async (req, res) => {
  try {
    // 🔐 Role check
    if (!isAdmin(req.user.role) && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins and super admins can create projects",
      });
    }

    // 📥 Extract body
    const {
      projectName,
      siteName,
      location,
      area,
      client,
      labour,
      site_manager,
      AttributeSet: attributeSetIds,
      attributes, 
      startDate,
      expectedEndDate,
      extracost,
      phases,
      documents,
    } = req.body;

    // ✅ Required fields only
    if (
      !projectName ||
      !siteName ||
      !startDate ||
      extracost === undefined ||
      !area
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: projectName, siteName, startDate, extracost, and area are required",
      });
    }

    // ✅ Validate area
    if (area < 0) {
      return res.status(400).json({
        success: false,
        message: "Area cannot be negative",
      });
    }

    // ✅ Validate extracost
    if (extracost < 0) {
      return res.status(400).json({
        success: false,
        message: "extracost cannot be negative",
      });
    }

    // ✅ Validate client ONLY if provided
    if (client) {
      const clientExists = await User.findById(client);
      if (!clientExists) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }

      if (clientExists.role !== "client") {
        return res.status(400).json({
          success: false,
          message: "Assigned user must have the 'client' role",
        });
      }
    }

    // ✅ Validate site_manager ONLY if provided
    if (site_manager) {
      const pmExists = await User.findById(site_manager);
      if (!pmExists) {
        return res.status(404).json({
          success: false,
          message: "Site Manager not found",
        });
      }

      if (pmExists.role !== "site_manager") {
        return res.status(400).json({
          success: false,
          message: "Assigned site manager must have the 'site_manager' role",
        });
      }
    }

    // ✅ Validate labour ONLY if provided
    if (labour && labour.length > 0) {
      const labourIds = Array.isArray(labour) ? labour : [labour];
      const labourUsers = await User.find({
        _id: { $in: labourIds },
        role: "labour",
      });

      if (labourUsers.length !== labourIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more users are not valid labour",
        });
      }
    }

    // ✅ Validate AttributeSet if provided
    let attributeSetArray = [];
    if (attributeSetIds) {
      attributeSetArray = Array.isArray(attributeSetIds)
        ? attributeSetIds
        : [attributeSetIds];

      const attributeSetCount = await AttributeSet.countDocuments({
        _id: { $in: attributeSetArray },
      });

      if (attributeSetCount !== attributeSetArray.length) {
        return res.status(404).json({
          success: false,
          message: "One or more AttributeSets not found",
        });
      }
    }

    // ✅ Validate direct attributes if provided
    let validatedAttributes = [];
    if (attributes && attributes.length > 0) {
      for (const item of attributes) {
        if (!item.attribute || !item.quantity) {
          return res.status(400).json({
            success: false,
            message: "Each attribute must have attribute ID and quantity",
          });
        }

        if (item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message: "Quantity must be at least 1",
          });
        }

        const attributeExists = await Attribute.findById(item.attribute);
        if (!attributeExists) {
          return res.status(404).json({
            success: false,
            message: `Attribute with ID ${item.attribute} not found`,
          });
        }

        validatedAttributes.push({
          attribute: item.attribute,
          quantity: item.quantity,
        });
      }
    }

    // ✅ Validate phases if provided
    if (phases && phases.length > 0) {
      const validPhases = phases.every((phase) =>
        ["FOUNDATION", "STRUCTURE", "FINISHING", "HANDOVER"].includes(
          phase.phaseName,
        ),
      );
      if (!validPhases) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid phase name. Must be one of: FOUNDATION, STRUCTURE, FINISHING, HANDOVER",
        });
      }
    }

    // ✅ Calculate initial progress from phases
    let progressPercentage = 0;
    if (phases && phases.length > 0) {
      const completedPhases = phases.filter((p) => p.isCompleted).length;
      progressPercentage = (completedPhases / phases.length) * 100;
    }

    // ✅ Determine project status based on progress
    let projectStatus = "planning";
    if (progressPercentage > 0 && progressPercentage < 100) {
      projectStatus = "in_progress";
    } else if (progressPercentage === 100) {
      projectStatus = "completed";
    }

    // ✅ Validate expectedEndDate against startDate
    if (expectedEndDate && new Date(expectedEndDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Expected end date must be after start date",
      });
    }

    // ✅ Create project
    const project = await Project.create({
      projectName,
      siteName,
      location,
      area,
      client: client || null,
      labour: labour || [],
      site_manager: site_manager || null,
      createdBy: req.user._id,
      AttributeSet: attributeSetArray,
      attributes: validatedAttributes,
      startDate,
      expectedEndDate,
      extracost,
      phases: phases || [],
      documents: documents || [],
      progressPercentage,
      projectStatus,
    });

    // ✅ Populate response
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("labour", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("AttributeSet")
      .populate({
        path: "attributes.attribute",
        model: "Attribute",
        select: "label type unit pricing",
      });

    return res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      projectStatus,
      approvalStatus,
      client,
      labour,
      site_manager,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = buildRoleFilter(req.user);

    if (projectStatus) filter.projectStatus = projectStatus;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    if (isAdmin(req.user.role)) {
      if (client) filter.client = new mongoose.Types.ObjectId(client);
      if (site_manager)
        filter.site_manager = new mongoose.Types.ObjectId(site_manager);
      if (labour) {
        const labourIds = Array.isArray(labour)
          ? labour.map((id) => new mongoose.Types.ObjectId(id))
          : [new mongoose.Types.ObjectId(labour)];
        filter.labour = { $in: labourIds };
      }
    }

    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { siteName: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
        { "location.state": { $regex: search, $options: "i" } },
        { "location.pincode": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortStage = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const pipeline = [
      { $match: filter },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: Number(limit) },

      // -------- USERS LOOKUPS --------
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "client",
        },
      },
      {
        $unwind: {
          path: "$client",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "site_manager",
          foreignField: "_id",
          as: "site_manager",
        },
      },
      {
        $unwind: {
          path: "$site_manager",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "labour",
          foreignField: "_id",
          as: "labour",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },

      // -------- ATTRIBUTE SETS with populated attributes --------
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
          pipeline: [
            {
              $lookup: {
                from: "attributes",
                localField: "attributes",
                foreignField: "_id",
                as: "populatedAttributes",
              }
            },
            {
              $addFields: {
                attributes: "$populatedAttributes"
              }
            },
            {
              $project: {
                populatedAttributes: 0
              }
            }
          ]
        },
      },

      // -------- DIRECT ATTRIBUTES --------
      {
        $lookup: {
          from: "attributes",
          localField: "attributes.attribute",
          foreignField: "_id",
          as: "directAttributeDetails",
        },
      },

      // Create a map of direct attributes for easy access
      {
        $addFields: {
          directAttributeMap: {
            $arrayToObject: {
              $map: {
                input: "$directAttributeDetails",
                as: "attr",
                in: {
                  k: { $toString: "$$attr._id" },
                  v: "$$attr",
                },
              },
            },
          },
        },
      },

      // Enrich direct attributes with full details
      {
        $addFields: {
          attributes: {
            $map: {
              input: "$attributes",
              as: "item",
              in: {
                attribute: {
                  $mergeObjects: [
                    { _id: "$$item.attribute" },
                    {
                      $getField: {
                        field: { $toString: "$$item.attribute" },
                        input: "$directAttributeMap",
                      },
                    },
                  ],
                },
                quantity: "$$item.quantity",
              },
            },
          },
        },
      },

      // Calculate totals from attribute sets
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                attributes: "$$set.attributes",
                createdBy: "$$set.createdBy",
                createdAt: "$$set.createdAt",
                updatedAt: "$$set.updatedAt",
                setTotal: {
                  $sum: {
                    $map: {
                      input: { $ifNull: ["$$set.attributes", []] },
                      as: "attr",
                      in: { $ifNull: ["$$attr.pricing", 0] },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Calculate total from attribute sets
      {
        $addFields: {
          attributeSetTotal: {
            $sum: "$attributeSets.setTotal",
          },
        },
      },

      // Calculate total from direct attributes with quantities
      {
        $addFields: {
          directAttributesTotal: {
            $sum: {
              $map: {
                input: "$attributes",
                as: "item",
                in: {
                  $multiply: [
                    { $ifNull: ["$$item.quantity", 1] },
                    { $ifNull: ["$$item.attribute.pricing", 0] },
                  ],
                },
              },
            },
          },
        },
      },

      // Calculate final totals
      {
        $addFields: {
          projectTotal: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$directAttributesTotal", 0] },
            ],
          },
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$directAttributesTotal", 0] },
              { $ifNull: ["$extracost", 0] },
            ],
          },
        },
      },

      // Clean up temporary fields
      {
        $project: {
          directAttributeDetails: 0,
          directAttributeMap: 0,
          attributeSetTotal: 0,
          directAttributesTotal: 0,
        },
      },
    ];

    const projects = await Project.aggregate(pipeline);
    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Projects Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const pipeline = [
      { $match: { _id: projectId } },

      // User lookups
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "site_manager",
          foreignField: "_id",
          as: "site_manager",
        },
      },
      { $unwind: { path: "$site_manager", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "labour",
          foreignField: "_id",
          as: "labour",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      // Attribute Sets lookup with populated attributes
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
          pipeline: [
            {
              $lookup: {
                from: "attributes",
                localField: "attributes",
                foreignField: "_id",
                as: "populatedAttributes",
              }
            },
            {
              $addFields: {
                attributes: "$populatedAttributes"
              }
            },
            {
              $project: {
                populatedAttributes: 0
              }
            }
          ]
        },
      },

      // Direct attributes lookup with pricing
      {
        $lookup: {
          from: "attributes",
          localField: "attributes.attribute",
          foreignField: "_id",
          as: "directAttributeDetails",
        },
      },

      // Create map for direct attributes with pricing
      {
        $addFields: {
          directAttributeMap: {
            $arrayToObject: {
              $map: {
                input: "$directAttributeDetails",
                as: "attr",
                in: {
                  k: { $toString: "$$attr._id" },
                  v: {
                    _id: "$$attr._id",
                    label: "$$attr.label",
                    type: "$$attr.type",
                    pricing: "$$attr.pricing",
                    unit: "$$attr.unit"
                  },
                },
              },
            },
          },
        },
      },

      // Enrich direct attributes with details
      {
        $addFields: {
          enrichedAttributes: {
            $map: {
              input: "$attributes",
              as: "item",
              in: {
                attribute: {
                  $mergeObjects: [
                    { _id: "$$item.attribute" },
                    {
                      $getField: {
                        field: { $toString: "$$item.attribute" },
                        input: "$directAttributeMap",
                      },
                    },
                  ],
                },
                quantity: "$$item.quantity",
              },
            },
          },
        },
      },

      // Calculate totals from attribute sets
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                attributes: "$$set.attributes",
                createdBy: "$$set.createdBy",
                createdAt: "$$set.createdAt",
                updatedAt: "$$set.updatedAt",
                setTotal: {
                  $sum: {
                    $map: {
                      input: { $ifNull: ["$$set.attributes", []] },
                      as: "attr",
                      in: { $ifNull: ["$$attr.pricing", 0] },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Calculate totals correctly
      {
        $addFields: {
          // Total from attribute sets
          attributeSetTotal: {
            $sum: "$attributeSets.setTotal",
          },
          
          // Total from direct attributes with quantities
          directAttributesTotal: {
            $sum: {
              $map: {
                input: "$enrichedAttributes",
                as: "item",
                in: {
                  $multiply: [
                    { $ifNull: ["$$item.quantity", 1] },
                    { $ifNull: ["$$item.attribute.pricing", 0] }
                  ]
                }
              }
            }
          },
        },
      },

      {
        $addFields: {
          // Project total from attributes (sets + direct with quantities)
          projectTotal: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$directAttributesTotal", 0] },
            ],
          },
          
          // Final project total including extracost
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$directAttributesTotal", 0] },
              { $ifNull: ["$extracost", 0] },
            ],
          },
        },
      },

      // Replace attributes with enriched version
      {
        $addFields: {
          attributes: "$enrichedAttributes"
        }
      },

      // Clean up temporary fields
      {
        $project: {
          directAttributeDetails: 0,
          directAttributeMap: 0,
          attributeSetTotal: 0,
          directAttributesTotal: 0,
          enrichedAttributes: 0,
          "attributeSets.populatedAttributes": 0,
        },
      },
    ];

    const [project] = await Project.aggregate(pipeline);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access
    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get Project By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    console.log("🔵 Update Project API called");
    console.log("➡️ User:", {
      id: req.user?._id,
      role: req.user?.role,
    });
    console.log("➡️ Project ID:", req.params.id);
    console.log("➡️ Request Body:", JSON.stringify(req.body, null, 2));

    /* ===============================
       ROLE CHECK
    =============================== */
    if (["client", "labour"].includes(req.user.role)) {
      console.log("❌ Role not allowed:", req.user.role);
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update projects",
      });
    }

    /* ===============================
       PROJECT FETCH
    =============================== */
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log("❌ Project not found");
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.log("✅ Project found:", project._id);

    /* ===============================
       ACCESS CONTROL
    =============================== */
    if (!canAccessProject(req.user, project)) {
      console.log("❌ Access denied");
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    console.log("✅ Access granted");

    /* ===============================
       ADMIN ONLY UPDATES
    =============================== */

    // Client
    if (req.body.client !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign client",
        });
      }
      project.client = req.body.client || null;
    }

    // Site manager
    if (req.body.site_manager !== undefined) {
      project.site_manager = req.body.site_manager || null;
    }

    // Labour
    if (req.body.labour !== undefined) {
      project.labour = Array.isArray(req.body.labour)
        ? req.body.labour
        : [];
    }

    // AttributeSet
    if (req.body.AttributeSet !== undefined) {
      project.AttributeSet = Array.isArray(req.body.AttributeSet)
        ? req.body.AttributeSet
        : [];
    }

    // Attributes
    if (req.body.attributes !== undefined) {
      project.attributes = Array.isArray(req.body.attributes)
        ? req.body.attributes
        : [];
    }

    /* ===============================
       PHASES
    =============================== */
    if (req.body.phases !== undefined) {
      project.phases = req.body.phases || [];

      const total = project.phases.length;
      const completed = project.phases.filter(p => p.isCompleted).length;

      project.progressPercentage =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      console.log("📊 Progress recalculated:", project.progressPercentage);
    }

    /* ===============================
       LOCATION
    =============================== */
    if (req.body.location !== undefined) {
      project.location = req.body.location || project.location;
    }

    /* ===============================
       DOCUMENTS (FILTER EMPTY)
    =============================== */
    if (req.body.documents !== undefined) {
      project.documents = (req.body.documents || []).filter(
        d => d.name && d.url
      );
    }

    /* ===============================
       BASIC FIELDS
    =============================== */
    const basicFields = [
      "projectName",
      "siteName",
      "area",
      "startDate",
      "expectedEndDate",
      "projectStatus",
      "approvalStatus",
    ];

    for (const field of basicFields) {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    // 🔥 Fix: extraCost → extracost
    if (req.body.extraCost !== undefined) {
      project.extracost = req.body.extraCost;
    }

    /* ===============================
       DATE VALIDATION
    =============================== */
    if (project.startDate && project.expectedEndDate) {
      if (new Date(project.expectedEndDate) < new Date(project.startDate)) {
        return res.status(400).json({
          success: false,
          message: "Expected end date must be after start date",
        });
      }
    }

    await project.save();
    console.log("💾 Project saved");

    /* ===============================
       AGGREGATION PIPELINE (FIXED)
    =============================== */
    console.log("🧮 Running aggregation pipeline");

    const pipeline = [
      { $match: { _id: project._id } },

      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
          pipeline: [
            {
              $lookup: {
                from: "attributes",
                localField: "attributes",
                foreignField: "_id",
                as: "attributes",
              },
            },
          ],
        },
      },

      {
        $addFields: {
          attributeSetTotal: {
            $sum: {
              $map: {
                input: {
                  $reduce: {
                    input: "$attributeSets",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this.attributes"] },
                  },
                },
                as: "attr",
                in: { $ifNull: ["$$attr.pricing", 0] },
              },
            },
          },
        },
      },

      {
        $addFields: {
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$extracost", 0] },
            ],
          },
        },
      },
    ];

    const [projectWithTotals] = await Project.aggregate(pipeline);

    /* ===============================
       POPULATE RESPONSE
    =============================== */
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("labour", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("AttributeSet")
      .populate({
        path: "attributes.attribute",
        model: "Attribute",
        select: "label type unit pricing",
      });

    console.log("✅ Response ready");

    return res.json({
      success: true,
      data: {
        ...populatedProject.toObject(),
        projectTotal: projectWithTotals?.attributeSetTotal || 0,
        finalProjectTotal: projectWithTotals?.finalProjectTotal || 0,
      },
    });
  } catch (error) {
    console.error("🔥 Update Project Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete projects",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectStats = async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view project statistics",
      });
    }

    const matchStage = isGlobalAdmin(req.user.role)
      ? {}
      : { createdBy: req.user._id };

    const stats = await Project.aggregate([
      { $match: matchStage },

      // Attribute Sets lookup
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
        },
      },

      // Get all attribute IDs from attribute sets with their pricing
      {
        $lookup: {
          from: "attributes",
          localField: "attributeSets.attributes",
          foreignField: "_id",
          as: "setAttributes",
        },
      },

      // Direct attributes lookup
      {
        $lookup: {
          from: "attributes",
          localField: "attributes.attribute",
          foreignField: "_id",
          as: "directAttributeDetails",
        },
      },

      // Calculate totals
      {
        $addFields: {
          // Total from attribute sets (simple sum of all attribute pricings in sets)
          attributeSetTotal: {
            $sum: {
              $map: {
                input: { $ifNull: ["$setAttributes", []] },
                as: "attr",
                in: { $ifNull: ["$$attr.pricing", 0] },
              },
            },
          },

          // Total from direct attributes with quantities
          directAttributesTotal: {
            $sum: {
              $map: {
                input: "$attributes",
                as: "item",
                in: {
                  $multiply: [
                    { $ifNull: ["$$item.quantity", 1] },
                    {
                      $ifNull: [
                        {
                          $arrayElemAt: [
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$directAttributeDetails",
                                    cond: {
                                      $eq: ["$$this._id", "$$item.attribute"],
                                    },
                                  },
                                },
                                as: "attr",
                                in: "$$attr.pricing",
                              },
                            },
                            0,
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          totalAttributeValue: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$directAttributesTotal", 0] },
            ],
          },
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$attributeSetTotal", 0] },
              { $ifNull: ["$directAttributesTotal", 0] },
              { $ifNull: ["$extracost", 0] },
            ],
          },
        },
      },

      // Group for statistics
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalExtracost: { $sum: { $ifNull: ["$extracost", 0] } },
          totalAttributeValue: { $sum: "$totalAttributeValue" },
          totalFinalValue: { $sum: "$finalProjectTotal" },
          averageProgress: { $avg: "$progressPercentage" },

          // Area statistics
          totalArea: { $sum: { $ifNull: ["$area", 0] } },
          averageArea: { $avg: { $ifNull: ["$area", 0] } },
          minArea: { $min: { $ifNull: ["$area", 0] } },
          maxArea: { $max: { $ifNull: ["$area", 0] } },

          // Status counts
          projectStatuses: { $push: "$projectStatus" },
          approvalStatuses: { $push: "$approvalStatus" },
        },
      },

      // Process status counts
      {
        $addFields: {
          projectStatusBreakdown: {
            planning: {
              $size: {
                $filter: {
                  input: "$projectStatuses",
                  cond: { $eq: ["$$this", "planning"] },
                },
              },
            },
            in_progress: {
              $size: {
                $filter: {
                  input: "$projectStatuses",
                  cond: { $eq: ["$$this", "in_progress"] },
                },
              },
            },
            on_hold: {
              $size: {
                $filter: {
                  input: "$projectStatuses",
                  cond: { $eq: ["$$this", "on_hold"] },
                },
              },
            },
            completed: {
              $size: {
                $filter: {
                  input: "$projectStatuses",
                  cond: { $eq: ["$$this", "completed"] },
                },
              },
            },
          },
          approvalStatusBreakdown: {
            pending: {
              $size: {
                $filter: {
                  input: "$approvalStatuses",
                  cond: { $eq: ["$$this", "pending"] },
                },
              },
            },
            approved: {
              $size: {
                $filter: {
                  input: "$approvalStatuses",
                  cond: { $eq: ["$$this", "approved"] },
                },
              },
            },
            rejected: {
              $size: {
                $filter: {
                  input: "$approvalStatuses",
                  cond: { $eq: ["$$this", "rejected"] },
                },
              },
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          _id: 0,
          totalProjects: 1,
          areaStatistics: {
            totalArea: "$totalArea",
            averageArea: { $round: ["$averageArea", 2] },
            minArea: "$minArea",
            maxArea: "$maxArea",
          },
          financialSummary: {
            totalExtracost: "$totalExtracost",
            totalAttributeValue: "$totalAttributeValue",
            totalProjectValue: "$totalFinalValue",
          },
          averageProgress: { $round: ["$averageProgress", 2] },
          projectStatusBreakdown: 1,
          approvalStatusBreakdown: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalProjects: 0,
        areaStatistics: {
          totalArea: 0,
          averageArea: 0,
          minArea: 0,
          maxArea: 0,
        },
        financialSummary: {
          totalExtracost: 0,
          totalAttributeValue: 0,
          totalProjectValue: 0,
        },
        averageProgress: 0,
        projectStatusBreakdown: {
          planning: 0,
          in_progress: 0,
          on_hold: 0,
          completed: 0,
        },
        approvalStatusBreakdown: {
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get Project Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePhaseCompletion = async (req, res) => {
  try {
    const { projectId, phaseIndex } = req.params;
    const { isCompleted } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    if (!project.phases || !project.phases[phaseIndex]) {
      return res.status(404).json({
        success: false,
        message: "Phase not found",
      });
    }

    // Update phase completion
    project.phases[phaseIndex].isCompleted = isCompleted;
    if (isCompleted) {
      project.phases[phaseIndex].completionPercentage = 100;
    } else {
      project.phases[phaseIndex].completionPercentage = 0;
    }

    // Recalculate overall progress
    const total = project.phases.length;
    const completed = project.phases.filter((p) => p.isCompleted).length;
    project.progressPercentage = total > 0 ? (completed / total) * 100 : 0;

    // Update project status
    if (project.progressPercentage === 0) {
      project.projectStatus = "planning";
    } else if (project.progressPercentage === 100) {
      project.projectStatus = "completed";
    } else {
      project.projectStatus = "in_progress";
    }

    await project.save();

    // Populate response
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("labour", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("AttributeSet")
      .populate({
        path: "attributes.attribute",
        model: "Attribute",
        select: "label type unit pricing",
      });

    res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    console.error("Update Phase Completion Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Additional helper function to add attributes to a project
export const addProjectAttributes = async (req, res) => {
  try {
    const { id } = req.params;
    const { attributes } = req.body;

    if (!isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can add attributes to projects",
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    if (!attributes || !Array.isArray(attributes)) {
      return res.status(400).json({
        success: false,
        message: "Attributes must be an array",
      });
    }

    // Validate each attribute
    for (const item of attributes) {
      if (!item.attribute || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each attribute must have attribute ID and quantity",
        });
      }

      if (item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      const attributeExists = await Attribute.findById(item.attribute);
      if (!attributeExists) {
        return res.status(404).json({
          success: false,
          message: `Attribute with ID ${item.attribute} not found`,
        });
      }

      // Check for duplicates
      const existingAttribute = project.attributes.find(
        (attr) => attr.attribute.toString() === item.attribute,
      );

      if (existingAttribute) {
        return res.status(400).json({
          success: false,
          message: `Attribute ${item.attribute} already exists in project`,
        });
      }
    }

    // Add new attributes
    project.attributes.push(...attributes);
    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "attributes.attribute",
    );

    res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    console.error("Add Project Attributes Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to update attribute quantity
export const updateAttributeQuantity = async (req, res) => {
  try {
    const { projectId, attributeId } = req.params;
    const { quantity } = req.body;

    if (!isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update attribute quantities",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    const attributeIndex = project.attributes.findIndex(
      (attr) => attr.attribute.toString() === attributeId,
    );

    if (attributeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found in project",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    project.attributes[attributeIndex].quantity = quantity;
    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "attributes.attribute",
    );

    res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    console.error("Update Attribute Quantity Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to remove attribute from project
export const removeProjectAttribute = async (req, res) => {
  try {
    const { projectId, attributeId } = req.params;

    if (!isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can remove attributes from projects",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    const initialLength = project.attributes.length;
    project.attributes = project.attributes.filter(
      (attr) => attr.attribute.toString() !== attributeId,
    );

    if (project.attributes.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found in project",
      });
    }

    await project.save();

    res.json({
      success: true,
      message: "Attribute removed from project successfully",
    });
  } catch (error) {
    console.error("Remove Project Attribute Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
