import Project from "../models/Project.js";
import User from "../models/User.js";
import AttributeSet from "../models/AttributeSet.js";
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
      budget,
      phases,
      documents,
    } = req.body;

    // ✅ Required fields only
    if (
      !projectName ||
      !siteName ||
      !startDate ||
      !budget ||
      !attributeSetIds
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: projectName, siteName, startDate, budget, and AttributeSet are required",
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

    // ✅ Validate project manager ONLY if provided
    if (site_manager) {
      const pmExists = await User.findById(site_manager);
      if (!pmExists) {
        return res.status(404).json({
          success: false,
          message: "Project Manager not found",
        });
      }

      if (pmExists.role !== "site_manager") {
        return res.status(400).json({
          success: false,
          message: "Assigned project manager must have the 'site_manager' role",
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

    // ✅ Create project
    const project = await Project.create({
      projectName,
      siteName,
      location,
      client: client || null,
      labour: labour || null,
      site_manager: site_manager || null,
      createdBy: req.user._id,
      AttributeSet: attributeSetArray,
      startDate,
      expectedEndDate,
      budget,
      phases,
      documents,
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
      siteStatus,
      approvalStatus,
      client,
      labour,
      site_manager,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Base filter from role
    const filter = buildRoleFilter(req.user);

    // Status filters apply to all roles
    if (siteStatus) filter.siteStatus = siteStatus;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    // Only admins can additionally filter by client/site_manager from query
    if (isAdmin(req.user.role)) {
      if (client) filter.client = client;
      if (site_manager) filter.site_manager = site_manager;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { siteName: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(filter)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("labour", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate({
        path: "AttributeSet",
        populate: {
          path: "attributes",
        },
      })

      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("labour", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("AttributeSet"); // Populate AttributeSet

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this project",
      });
    }

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

export const updateProject = async (req, res) => {
  try {
    // ❌ Client & Labour cannot update projects
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
        if (!client || client.role !== "client") {
          return res.status(400).json({
            success: false,
            message: "Assigned user must be a valid client",
          });
        }
      }
    }

    // ✅ Project Manager validation
    if (req.body.site_manager !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign project manager",
        });
      }

      if (req.body.site_manager) {
        const pm = await User.findById(req.body.site_manager);
        if (!pm || pm.role !== "site_manager") {
          return res.status(400).json({
            success: false,
            message:
              "Assigned project manager must have role 'site_manager'",
          });
        }
      }
    }

    // ✅ Labour validation (🔥 FIXED PART)
    if (req.body.labour !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign labour",
        });
      }

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
    }

    // ✅ AttributeSet validation
    if (req.body.AttributeSet) {
      const ids = Array.isArray(req.body.AttributeSet)
        ? req.body.AttributeSet
        : [req.body.AttributeSet];

      const count = await AttributeSet.countDocuments({
        _id: { $in: ids },
      });

      if (count !== ids.length) {
        return res.status(404).json({
          success: false,
          message: "One or more AttributeSets not found",
        });
      }
    }

    /* ===============================
       FIELD PERMISSIONS
    =============================== */

    const adminFields = [
      "projectName",
      "siteName",
      "location",
      "client",
      "labour",
      "site_manager",
      "AttributeSet",
      "startDate",
      "expectedEndDate",
      "budget",
      "siteStatus",
      "phases",
      "documents",
      "approvalStatus",
    ];

    const siteManagerFields = ["siteStatus", "phases", "documents"];

    const allowedFields = isAdmin(req.user.role)
      ? adminFields
      : siteManagerFields;

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    /* ===============================
       AUTO PROGRESS
    =============================== */

    if (req.body.phases) {
      const total = project.phases.length;
      const completed = project.phases.filter(p => p.isCompleted).length;

      project.progressPercentage =
        total > 0 ? (completed / total) * 100 : 0;

      project.projectStatus =
        project.progressPercentage === 0
          ? "not_started"
          : project.progressPercentage === 100
            ? "completed"
            : "running";
    }

    await project.save();

    /* ===============================
       RESPONSE
    =============================== */

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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateApprovalStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update approval status",
      });
    }

    const { approvalStatus } = req.body;

    if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status",
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
        message: "Not authorized to update this project",
      });
    }

    project.approvalStatus = approvalStatus;
    await project.save();

    // Populate the updated project
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("AttributeSet");

    res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePhaseCompletion = async (req, res) => {
  try {
    if (req.user.role === "client" || req.user.role === "labour") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update phases",
      });
    }

    const { phaseIndex } = req.params;
    const { completionPercentage, isCompleted } = req.body;

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
        message: "Not authorized to update this project",
      });
    }

    if (!project.phases || !project.phases[phaseIndex]) {
      return res.status(404).json({
        success: false,
        message: "Phase not found",
      });
    }

    if (completionPercentage !== undefined) {
      // Validate completion percentage
      if (completionPercentage < 0 || completionPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: "Completion percentage must be between 0 and 100",
        });
      }
      project.phases[phaseIndex].completionPercentage = completionPercentage;
    }

    if (isCompleted !== undefined) {
      project.phases[phaseIndex].isCompleted = isCompleted;
      if (isCompleted) {
        project.phases[phaseIndex].completionPercentage = 100;
      }
    }

    // Recalculate overall progress
    const totalPhases = project.phases.length;
    const completedPhases = project.phases.filter(
      (phase) => phase.isCompleted,
    ).length;
    project.progressPercentage =
      totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    if (project.progressPercentage === 0) {
      project.projectStatus = "not_started";
    } else if (project.progressPercentage === 100) {
      project.projectStatus = "completed";
    } else {
      project.projectStatus = "running";
    }

    await project.save();

    // Populate the updated project
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email phoneNumber")
      .populate("site_manager", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("AttributeSet");

    res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addDocument = async (req, res) => {
  try {
    if (req.user.role === "client" || req.user.role === "labour") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add documents",
      });
    }

    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: "Document name and URL are required",
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
        message: "Not authorized to modify this project",
      });
    }

    project.documents.push({ name, url });
    await project.save();

    res.status(201).json({
      success: true,
      data: project.documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeDocument = async (req, res) => {
  try {
    if (req.user.role === "client" || req.user.role === "labour") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove documents",
      });
    }

    const { id, docId } = req.params;

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
        message: "Not authorized to modify this project",
      });
    }

    const documentExists = project.documents.some(
      (doc) => doc._id.toString() === docId,
    );

    if (!documentExists) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    project.documents = project.documents.filter(
      (doc) => doc._id.toString() !== docId,
    );

    await project.save();

    res.json({
      success: true,
      message: "Document removed successfully",
    });
  } catch (error) {
    res.status(500).json({
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
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalBudget: { $sum: "$budget" },
          averageProgress: { $avg: "$progressPercentage" },
          projectsByStatus: { $push: "$siteStatus" },
          projectsByApproval: { $push: "$approvalStatus" },
        },
      },
      {
        $project: {
          totalProjects: 1,
          totalBudget: 1,
          averageProgress: { $round: ["$averageProgress", 2] },
          siteStatusBreakdown: {
            planning: {
              $size: {
                $filter: {
                  input: "$projectsByStatus",
                  as: "status",
                  cond: { $eq: ["$$status", "planning"] },
                },
              },
            },
            in_progress: {
              $size: {
                $filter: {
                  input: "$projectsByStatus",
                  as: "status",
                  cond: { $eq: ["$$status", "in_progress"] },
                },
              },
            },
            on_hold: {
              $size: {
                $filter: {
                  input: "$projectsByStatus",
                  as: "status",
                  cond: { $eq: ["$$status", "on_hold"] },
                },
              },
            },
            completed: {
              $size: {
                $filter: {
                  input: "$projectsByStatus",
                  as: "status",
                  cond: { $eq: ["$$status", "completed"] },
                },
              },
            },
          },
          approvalBreakdown: {
            pending: {
              $size: {
                $filter: {
                  input: "$projectsByApproval",
                  as: "status",
                  cond: { $eq: ["$$status", "pending"] },
                },
              },
            },
            approved: {
              $size: {
                $filter: {
                  input: "$projectsByApproval",
                  as: "status",
                  cond: { $eq: ["$$status", "approved"] },
                },
              },
            },
            rejected: {
              $size: {
                $filter: {
                  input: "$projectsByApproval",
                  as: "status",
                  cond: { $eq: ["$$status", "rejected"] },
                },
              },
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalProjects: 0,
        totalBudget: 0,
        averageProgress: 0,
        siteStatusBreakdown: {
          planning: 0,
          in_progress: 0,
          on_hold: 0,
          completed: 0,
        },
        approvalBreakdown: { pending: 0, approved: 0, rejected: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
