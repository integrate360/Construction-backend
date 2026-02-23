import Project from "../models/Project.js";
import User from "../models/User.js";
import AttributeSet from "../models/AttributeSet.js";
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
      client, // optional
      labour, // optional
      site_manager, // optional
      AttributeSet: attributeSetIds,
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
      !extracost ||
      !attributeSetIds
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: projectName, siteName, startDate, extracost, and AttributeSet are required",
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

    // ✅ Normalize AttributeSet to array
    const attributeSetArray = Array.isArray(attributeSetIds)
      ? attributeSetIds
      : [attributeSetIds];

    // ✅ Validate AttributeSet existence
    const attributeSetCount = await AttributeSet.countDocuments({
      _id: { $in: attributeSetArray },
    });

    if (attributeSetCount !== attributeSetArray.length) {
      return res.status(404).json({
        success: false,
        message: "One or more AttributeSets not found",
      });
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

    // ✅ Create project
    const project = await Project.create({
      projectName,
      siteName,
      location,
      client: client || null,
      labour: labour || [],
      site_manager: site_manager || null,
      createdBy: req.user._id,
      AttributeSet: attributeSetArray,
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
      .populate("AttributeSet");

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
      includeBudgetBreakdown = "false",
    } = req.query;

    const filter = buildRoleFilter(req.user);

    if (projectStatus) filter.projectStatus = projectStatus;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    if (isAdmin(req.user.role)) {
      if (client) filter.client = new mongoose.Types.ObjectId(client);
      if (site_manager) filter.site_manager = new mongoose.Types.ObjectId(site_manager);
      if (labour) {
        const labourIds = Array.isArray(labour)
          ? labour.map(id => new mongoose.Types.ObjectId(id))
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
      { $lookup: { from: "users", localField: "client", foreignField: "_id", as: "client" } },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "users", localField: "site_manager", foreignField: "_id", as: "site_manager" } },
      { $unwind: { path: "$site_manager", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "users", localField: "labour", foreignField: "_id", as: "labour" } },

      // -------- ATTRIBUTE SETS --------
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
        },
      },

      {
        $addFields: {
          attributeSets: {
            $map: {
              input: { $ifNull: ["$attributeSets", []] },
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                attributes: {
                  $map: {
                    input: { $ifNull: ["$$set.attributes", []] },
                    as: "attr",
                    in: {
                      _id: "$$attr._id",
                      attributeId: "$$attr.attribute",
                      attributeKey: {
                        $cond: {
                          if: { $ne: ["$$attr.attribute", null] },
                          then: { $toString: "$$attr.attribute" },
                          else: null,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          allAttributeIds: {
            $reduce: {
              input: "$attributeSets",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this.attributes",
                      as: "a",
                      in: "$$a.attributeId",
                    },
                  },
                ],
              },
            },
          },
        },
      },

      {
        $lookup: {
          from: "attributes",
          let: { ids: "$allAttributeIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $project: { label: 1, pricing: 1 } },
          ],
          as: "allAttributes",
        },
      },

      {
        $addFields: {
          attributeMap: {
            $arrayToObject: {
              $map: {
                input: "$allAttributes",
                as: "a",
                in: {
                  k: { $toString: "$$a._id" },
                  v: "$$a",
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                attributes: {
                  $map: {
                    input: "$$set.attributes",
                    as: "attr",
                    in: {
                      attributeId: "$$attr.attributeId",
                      attribute: {
                        $cond: {
                          if: { $ne: ["$$attr.attributeKey", null] },
                          then: {
                            $getField: {
                              field: "$$attr.attributeKey",
                              input: "$attributeMap",
                            },
                          },
                          else: null,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          projectTotal: {
            $sum: {
              $map: {
                input: "$attributeSets",
                as: "set",
                in: {
                  $sum: {
                    $map: {
                      input: "$$set.attributes",
                      as: "a",
                      in: { $ifNull: ["$$a.attribute.pricing", 0] },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          finalProjectTotal: {
            $add: [{ $ifNull: ["$projectTotal", 0] }, { $ifNull: ["$extracost", 0] }],
          },
        },
      },

      { $project: { allAttributes: 0, attributeMap: 0, allAttributeIds: 0 } },
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
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const pipeline = [
      { $match: { _id: projectId } },

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
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      /* ---------------- ATTRIBUTE SETS ---------------- */

      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
        },
      },

      /* Normalize attributes safely */
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: { $ifNull: ["$attributeSets", []] },
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                createdBy: "$$set.createdBy",
                createdAt: "$$set.createdAt",
                updatedAt: "$$set.updatedAt",
                attributes: {
                  $map: {
                    input: { $ifNull: ["$$set.attributes", []] },
                    as: "attr",
                    in: {
                      attributeId: {
                        $cond: [
                          { $eq: [{ $type: "$$attr" }, "objectId"] },
                          "$$attr",
                          "$$attr.attribute",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      /* ---------------- ATTRIBUTES ---------------- */

      {
        $lookup: {
          from: "attributes",
          let: {
            attrIds: {
              $reduce: {
                input: "$attributeSets",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    {
                      $map: {
                        input: "$$this.attributes",
                        as: "a",
                        in: "$$a.attributeId",
                      },
                    },
                  ],
                },
              },
            },
          },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$attrIds"] } } },
            { $project: { label: 1, type: 1, pricing: 1 } },
          ],
          as: "allAttributes",
        },
      },

      {
        $addFields: {
          attributeMap: {
            $arrayToObject: {
              $map: {
                input: "$allAttributes",
                as: "a",
                in: {
                  k: { $toString: "$$a._id" },
                  v: "$$a",
                },
              },
            },
          },
        },
      },

      /* Populate attributes safely */
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                attributes: {
                  $map: {
                    input: "$$set.attributes",
                    as: "a",
                    in: {
                      attribute: {
                        $ifNull: [
                          {
                            $getField: {
                              field: { $toString: "$$a.attributeId" },
                              input: "$attributeMap",
                            },
                          },
                          null,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      /* ---------------- TOTALS ---------------- */

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
                setTotal: {
                  $sum: {
                    $map: {
                      input: "$$set.attributes",
                      as: "a",
                      in: { $ifNull: ["$$a.attribute.pricing", 0] },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          projectTotal: { $sum: "$attributeSets.setTotal" },
          finalProjectTotal: {
            $add: [
              { $ifNull: [{ $sum: "$attributeSets.setTotal" }, 0] },
              { $ifNull: ["$extracost", 0] },
            ],
          },
        },
      },

      { $project: { attributeMap: 0, allAttributes: 0 } },
    ];

    const [project] = await Project.aggregate(pipeline);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

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
    // 🔐 Role check
    if (req.user.role === "client" || req.user.role === "labour") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update projects",
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // 🔐 Access control
    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    /* ===============================
       ADMIN-ONLY VALIDATIONS
    =============================== */

    // ✅ Client validation
    if (req.body.client !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign client",
        });
      }

      if (req.body.client) {
        const client = await User.findById(req.body.client);
        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Client not found",
          });
        }

        if (client.role !== "client") {
          return res.status(400).json({
            success: false,
            message: "Assigned user must have the 'client' role",
          });
        }
        project.client = req.body.client;
      } else {
        project.client = null;
      }
    }

    // ✅ Site Manager validation
    if (req.body.site_manager !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign site manager",
        });
      }

      if (req.body.site_manager) {
        const siteManager = await User.findById(req.body.site_manager);
        if (!siteManager) {
          return res.status(404).json({
            success: false,
            message: "Site Manager not found",
          });
        }

        if (siteManager.role !== "site_manager") {
          return res.status(400).json({
            success: false,
            message: "Assigned site manager must have the 'site_manager' role",
          });
        }
        project.site_manager = req.body.site_manager;
      } else {
        project.site_manager = null;
      }
    }

    // ✅ Labour validation
    if (req.body.labour !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign labour",
        });
      }

      if (req.body.labour && req.body.labour.length > 0) {
        const labourIds = Array.isArray(req.body.labour)
          ? req.body.labour
          : [req.body.labour];

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
        project.labour = labourIds;
      } else {
        project.labour = [];
      }
    }

    // ✅ AttributeSet validation
    if (req.body.AttributeSet !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can update AttributeSet",
        });
      }

      if (req.body.AttributeSet && req.body.AttributeSet.length > 0) {
        const attributeSetIds = Array.isArray(req.body.AttributeSet)
          ? req.body.AttributeSet
          : [req.body.AttributeSet];

        const attributeSetCount = await AttributeSet.countDocuments({
          _id: { $in: attributeSetIds },
        });

        if (attributeSetCount !== attributeSetIds.length) {
          return res.status(404).json({
            success: false,
            message: "One or more AttributeSets not found",
          });
        }
        project.AttributeSet = attributeSetIds;
      } else {
        return res.status(400).json({
          success: false,
          message: "AttributeSet cannot be empty",
        });
      }
    }

    // ✅ Phase validation
    if (req.body.phases !== undefined) {
      if (req.body.phases && req.body.phases.length > 0) {
        const validPhases = req.body.phases.every((phase) =>
          ["FOUNDATION", "STRUCTURE", "FINISHING", "HANDOVER"].includes(
            phase.phaseName,
          )
        );

        if (!validPhases) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid phase name. Must be one of: FOUNDATION, STRUCTURE, FINISHING, HANDOVER",
          });
        }

        // Validate each phase has required fields
        const phasesValid = req.body.phases.every(
          (phase) =>
            phase.hasOwnProperty("completionPercentage") &&
            phase.hasOwnProperty("isCompleted")
        );

        if (!phasesValid) {
          return res.status(400).json({
            success: false,
            message:
              "Each phase must have completionPercentage and isCompleted fields",
          });
        }

        project.phases = req.body.phases;
      } else {
        project.phases = [];
      }
    }

    // ✅ Documents validation
    if (req.body.documents !== undefined) {
      if (req.body.documents && req.body.documents.length > 0) {
        // Validate each document has required fields
        const documentsValid = req.body.documents.every(
          (doc) => doc.name && doc.url
        );

        if (!documentsValid) {
          return res.status(400).json({
            success: false,
            message: "Each document must have name and url fields",
          });
        }
        project.documents = req.body.documents;
      } else {
        project.documents = [];
      }
    }

    // ✅ Location validation
    if (req.body.location !== undefined) {
      if (req.body.location) {
        // Validate coordinates if provided
        if (req.body.location.coordinates && req.body.location.coordinates.coordinates) {
          const coords = req.body.location.coordinates.coordinates;
          if (!Array.isArray(coords) || coords.length !== 2) {
            return res.status(400).json({
              success: false,
              message: "Coordinates must be an array of [longitude, latitude]",
            });
          }
        }
        project.location = req.body.location;
      } else {
        project.location = undefined;
      }
    }

    /* ===============================
       FIELD UPDATES (COMMON FIELDS)
    =============================== */

    // Update basic fields (accessible by both admin and site manager)
    const basicFields = [
      "projectName",
      "siteName",
      "startDate",
      "expectedEndDate",
      "extracost",
      "projectStatus",
      "approvalStatus",
    ];

    basicFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Special validation for dates
        if (field === "expectedEndDate" && req.body.expectedEndDate) {
          const startDate = req.body.startDate || project.startDate;
          if (startDate && new Date(req.body.expectedEndDate) < new Date(startDate)) {
            return res.status(400).json({
              success: false,
              message: "End date must be after start date",
            });
          }
        }
        
        // Validation for extracost
        if (field === "extracost" && req.body.extracost < 0) {
          return res.status(400).json({
            success: false,
            message: "extracost cannot be negative",
          });
        }

        project[field] = req.body[field];
      }
    });

    /* ===============================
       AUTO PROGRESS & STATUS CALCULATION
    =============================== */

    // Recalculate progress if phases were updated
    if (req.body.phases !== undefined) {
      const total = project.phases.length;
      const completed = project.phases.filter((p) => p.isCompleted).length;

      project.progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Update project status based on progress (only if not manually set)
      if (req.body.projectStatus === undefined) {
        if (project.progressPercentage === 0) {
          project.projectStatus = "planning";
        } else if (project.progressPercentage === 100) {
          project.projectStatus = "completed";
        } else if (project.progressPercentage > 0 && project.progressPercentage < 100) {
          project.projectStatus = "in_progress";
        }
      }
    }

    // Validate expectedEndDate against startDate if both are present
    if (project.startDate && project.expectedEndDate) {
      if (new Date(project.expectedEndDate) < new Date(project.startDate)) {
        return res.status(400).json({
          success: false,
          message: "Expected end date must be after start date",
        });
      }
    }

    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("labour", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate({
        path: "AttributeSet",
        populate: { path: "attributes" },
      });

    return res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    console.error("Update Project Error:", error);
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

      // -------- ATTRIBUTE SETS --------
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets",
        },
      },

      // Flatten attributes
      {
        $addFields: {
          allAttributes: {
            $reduce: {
              input: { $ifNull: ["$attributeSets", []] },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  { $ifNull: ["$$this.attributes", []] },
                ],
              },
            },
          },
        },
      },

      // SAFE attributeId + attributeKey
      {
        $addFields: {
          allAttributes: {
            $map: {
              input: "$allAttributes",
              as: "attr",
              in: {
                attributeId: "$$attr.attribute",
                attributeKey: {
                  $cond: {
                    if: { $ne: ["$$attr.attribute", null] },
                    then: { $toString: "$$attr.attribute" },
                    else: null,
                  },
                },
              },
            },
          },
        },
      },

      // Collect attribute IDs
      {
        $addFields: {
          attributeIds: {
            $map: {
              input: "$allAttributes",
              as: "a",
              in: "$$a.attributeId",
            },
          },
        },
      },

      // Lookup attributes
      {
        $lookup: {
          from: "attributes",
          let: { ids: "$attributeIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $project: { pricing: 1 } },
          ],
          as: "attributeDetails",
        },
      },

      // Pricing map
      {
        $addFields: {
          attributePricingMap: {
            $arrayToObject: {
              $map: {
                input: "$attributeDetails",
                as: "a",
                in: {
                  k: { $toString: "$$a._id" },
                  v: "$$a.pricing",
                },
              },
            },
          },
        },
      },

      // SAFE total calculation
      {
        $addFields: {
          calculatedProjectTotal: {
            $sum: {
              $map: {
                input: "$allAttributes",
                as: "a",
                in: {
                  $cond: {
                    if: { $ne: ["$$a.attributeKey", null] },
                    then: {
                      $ifNull: [
                        {
                          $getField: {
                            field: "$$a.attributeKey",
                            input: "$attributePricingMap",
                          },
                        },
                        0,
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
          },
        },
      },

      // Final totals
      {
        $addFields: {
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$calculatedProjectTotal", 0] },
              { $ifNull: ["$extracost", 0] },
            ],
          },
          budgetVariance: {
            $subtract: [
              { $ifNull: ["$budget", 0] },
              {
                $add: [
                  { $ifNull: ["$calculatedProjectTotal", 0] },
                  { $ifNull: ["$extracost", 0] },
                ],
              },
            ],
          },
        },
      },

      // -------- GROUP STATS --------
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalBudget: { $sum: { $ifNull: ["$budget", 0] } },
          totalExtracost: { $sum: { $ifNull: ["$extracost", 0] } },
          totalAttributeValue: { $sum: "$calculatedProjectTotal" },
          totalFinalValue: { $sum: "$finalProjectTotal" },
          averageProgress: { $avg: "$progressPercentage" },

          projectStatuses: { $push: "$projectStatus" },
          approvalStatuses: { $push: "$approvalStatus" },

          overBudgetCount: {
            $sum: { $cond: [{ $lt: ["$budgetVariance", 0] }, 1, 0] },
          },
          underBudgetCount: {
            $sum: { $cond: [{ $gt: ["$budgetVariance", 0] }, 1, 0] },
          },
          exactBudgetCount: {
            $sum: { $cond: [{ $eq: ["$budgetVariance", 0] }, 1, 0] },
          },
        },
      },

      // -------- FINAL SHAPE --------
      {
        $project: {
          _id: 0,
          totalProjects: 1,
          financialSummary: {
            totalBudget: "$totalBudget",
            totalExtracost: "$totalExtracost",
            totalAttributeValue: "$totalAttributeValue",
            totalProjectValue: "$totalFinalValue",
          },
          averageProgress: { $round: ["$averageProgress", 2] },
          budgetHealth: {
            overBudget: "$overBudgetCount",
            underBudget: "$underBudgetCount",
            exactBudget: "$exactBudgetCount",
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {},
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

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
