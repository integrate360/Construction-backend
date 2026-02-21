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
import {calculateextracostBreakdown, calculatePhaseextracostAllocation} from "../helpers/costfunction.js";

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
      includeBudgetBreakdown = "false", // Renamed from includeextracostBreakdown
    } = req.query;

    // Base filter from role
    const filter = buildRoleFilter(req.user);

    // Status filters apply to all roles
    if (projectStatus) filter.projectStatus = projectStatus;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    // Only admins can additionally filter by client/site_manager from query
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

    // Search filter
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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortStage = {};
    sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Aggregation pipeline
    const pipeline = [
      // Match stage
      { $match: filter },
      
      // Sort stage
      { $sort: sortStage },
      
      // Skip for pagination
      { $skip: skip },
      
      // Limit for pagination
      { $limit: parseInt(limit) },
      
      // Lookup client details
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "client"
        }
      },
      {
        $unwind: {
          path: "$client",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          "client": {
            _id: "$client._id",
            name: "$client.name",
            email: "$client.email",
            phoneNumber: "$client.phoneNumber"
          }
        }
      },
      
      // Lookup site manager details
      {
        $lookup: {
          from: "users",
          localField: "site_manager",
          foreignField: "_id",
          as: "site_manager"
        }
      },
      {
        $unwind: {
          path: "$site_manager",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          "site_manager": {
            _id: "$site_manager._id",
            name: "$site_manager.name",
            email: "$site_manager.email",
            phoneNumber: "$site_manager.phoneNumber"
          }
        }
      },
      
      // Lookup labour details
      {
        $lookup: {
          from: "users",
          localField: "labour",
          foreignField: "_id",
          as: "labour"
        }
      },
      {
        $addFields: {
          "labour": {
            $map: {
              input: "$labour",
              as: "l",
              in: {
                _id: "$$l._id",
                name: "$$l.name",
                email: "$$l.email",
                phoneNumber: "$$l.phoneNumber"
              }
            }
          }
        }
      },
      
      // Lookup createdBy details
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          "createdBy": {
            _id: "$createdBy._id",
            name: "$createdBy.name",
            email: "$createdBy.email"
          }
        }
      },
      
      // Lookup attribute sets
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets"
        }
      },
      
      // Process attribute sets to get valid attributes
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
                      quantity: { $ifNull: ["$$attr.quantity", 1] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      // Get all attribute IDs from all sets
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
                      input: { $ifNull: ["$$this.attributes", []] },
                      as: "attr",
                      in: "$$attr.attributeId"
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // Lookup all attributes in one go
      {
        $lookup: {
          from: "attributes",
          let: { attributeIds: "$allAttributeIds" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$attributeIds"] }
              }
            },
            {
              $project: {
                _id: 1,
                label: 1,
                type: 1,
                pricing: 1
              }
            }
          ],
          as: "allAttributes"
        }
      },
      
      // Create attribute map for easy lookup
      {
        $addFields: {
          attributeMap: {
            $arrayToObject: {
              $map: {
                input: "$allAttributes",
                as: "attr",
                in: {
                  k: { $toString: "$$attr._id" },
                  v: "$$attr"
                }
              }
            }
          }
        }
      },
      
      // Reconstruct attribute sets with populated attributes
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
                    input: { $ifNull: ["$$set.attributes", []] },
                    as: "attr",
                    in: {
                      _id: "$$attr._id",
                      quantity: "$$attr.quantity",
                      attribute: {
                        $ifNull: [
                          { $getField: { field: { $toString: "$$attr.attributeId" }, input: "$attributeMap" } },
                          null
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      // Calculate totals for each attribute set
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
                      _id: "$$attr._id",
                      quantity: "$$attr.quantity",
                      attribute: "$$attr.attribute",
                      totalCost: {
                        $cond: {
                          if: { 
                            $and: [
                              { $ne: ["$$attr.attribute", null] },
                              { $isNumber: "$$attr.attribute.pricing" }
                            ]
                          },
                          then: {
                            $multiply: [
                              "$$attr.attribute.pricing",
                              { $ifNull: ["$$attr.quantity", 1] }
                            ]
                          },
                          else: 0
                        }
                      }
                    }
                  }
                },
                setTotal: {
                  $sum: {
                    $map: {
                      input: "$$set.attributes",
                      as: "attr",
                      in: {
                        $cond: {
                          if: { 
                            $and: [
                              { $ne: ["$$attr.attribute", null] },
                              { $isNumber: "$$attr.attribute.pricing" }
                            ]
                          },
                          then: {
                            $multiply: [
                              "$$attr.attribute.pricing",
                              { $ifNull: ["$$attr.quantity", 1] }
                            ]
                          },
                          else: 0
                        }
                      }
                    }
                  }
                },
                attributeCount: { $size: "$$set.attributes" },
                validAttributes: {
                  $size: {
                    $filter: {
                      input: "$$set.attributes",
                      as: "attr",
                      cond: { 
                        $and: [
                          { $ne: ["$$attr.attribute", null] },
                          { $isNumber: "$$attr.attribute.pricing" }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      // Calculate project total from attribute sets
      {
        $addFields: {
          projectTotal: {
            $sum: {
              $map: {
                input: "$attributeSets",
                as: "set",
                in: "$$set.setTotal"
              }
            }
          }
        }
      },
      
      // Calculate final total including extracost
      {
        $addFields: {
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$projectTotal", 0] },
              { $ifNull: ["$extracost", 0] }
            ]
          }
        }
      },
      
      // Calculate total valid and invalid attributes
      {
        $addFields: {
          totalAttributes: {
            $sum: {
              $map: {
                input: "$attributeSets",
                as: "set",
                in: "$$set.attributeCount"
              }
            }
          },
          totalValidAttributes: {
            $sum: {
              $map: {
                input: "$attributeSets",
                as: "set",
                in: "$$set.validAttributes"
              }
            }
          }
        }
      },
      
      // Add percentage calculations for each set
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                $mergeObjects: [
                  "$$set",
                  {
                    percentageOfTotal: {
                      $cond: {
                        if: { $gt: ["$projectTotal", 0] },
                        then: {
                          $concat: [
                            { $toString: { $round: [{ $multiply: [{ $divide: ["$$set.setTotal", "$projectTotal"] }, 100] }, 2] } },
                            "%"
                          ]
                        },
                        else: "0%"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // Clean up temporary fields
      {
        $project: {
          allAttributeIds: 0,
          allAttributes: 0,
          attributeMap: 0
        }
      }
    ];

    // Execute aggregation for projects
    const projects = await Project.aggregate(pipeline);

    // Get total count for pagination
    const total = await Project.countDocuments(filter);

    // Transform projects to include budget breakdown if requested
    let transformedProjects = projects;
    
    if (includeBudgetBreakdown === "true") {
      transformedProjects = projects.map(project => {
        const projectTotal = project.projectTotal || 0;
        const extracost = project.extracost || 0;
        const finalProjectTotal = project.finalProjectTotal || (projectTotal + extracost);
        const totalBudget = project.budget || 0;

        // Calculate phase budget allocation (simplified for list view)
        const phaseWeightages = {
          'FOUNDATION': 0.20,
          'STRUCTURE': 0.40,
          'FINISHING': 0.30,
          'HANDOVER': 0.10
        };

        const phaseBudgetAllocation = (project.phases || []).map((phase, index) => {
          const phaseName = phase.phaseName;
          const weightage = phaseWeightages[phaseName] || 0;
          const allocatedBudget = totalBudget * weightage;
          
          return {
            phaseName: phase.phaseName,
            completionPercentage: phase.completionPercentage || 0,
            isCompleted: phase.isCompleted || false,
            allocatedBudget: Math.round(allocatedBudget),
            weightage: `${weightage * 100}%`
          };
        });

        // Create comprehensive budget breakdown
        const budgetBreakdown = {
          // Main cost components
          totalAttributesValue: projectTotal,
          extracostValue: extracost,
          finalTotalValue: finalProjectTotal,
          
          // Simplified attribute sets for list view
          attributeSets: (project.attributeSets || []).map(set => ({
            _id: set._id,
            name: set.name,
            totalPricing: set.setTotal || 0,
            attributeCount: set.attributeCount || 0,
            validAttributes: set.validAttributes || 0,
            invalidAttributes: (set.attributeCount || 0) - (set.validAttributes || 0),
            percentageOfTotal: set.percentageOfTotal || "0%",
            // Include top items only for list view (first 2 items)
            topItems: (set.attributes || [])
              .filter(attr => attr.attribute)
              .slice(0, 2)
              .map(attr => ({
                label: attr.attribute?.label,
                totalPrice: attr.totalCost || 0
              }))
          })),
          
          // Summary statistics
          summary: {
            totalItems: project.totalAttributes || 0,
            totalValidItems: project.totalValidAttributes || 0,
            totalInvalidItems: (project.totalAttributes || 0) - (project.totalValidAttributes || 0),
            averagePricePerItem: project.totalValidAttributes > 0 
              ? (projectTotal / project.totalValidAttributes).toFixed(2) 
              : "0.00"
          },
          
          // Budget utilization
          budgetUtilization: {
            totalBudget,
            allocatedValue: projectTotal,
            extracost,
            finalTotal: finalProjectTotal,
            remainingBudget: totalBudget - finalProjectTotal,
            allocatedPercentage: totalBudget > 0 
              ? ((projectTotal / totalBudget) * 100).toFixed(2) + '%' 
              : '0%',
            finalTotalPercentage: totalBudget > 0 
              ? ((finalProjectTotal / totalBudget) * 100).toFixed(2) + '%' 
              : '0%',
            status: totalBudget === 0 ? 'NO_BUDGET' :
                    finalProjectTotal > totalBudget ? 'OVER_BUDGET' : 
                    finalProjectTotal === totalBudget ? 'FULLY_ALLOCATED' : 
                    'WITHIN_BUDGET',
            utilizationRatio: totalBudget > 0 
              ? (finalProjectTotal / totalBudget).toFixed(2) 
              : '0.00'
          }
        };

        return {
          ...project,
          // Include all totals
          projectTotal,
          extracost,
          finalProjectTotal,
          // Add breakdowns
          budgetBreakdown,
          phaseBudgetAllocation,
          // Quick status indicator
          budgetStatus: {
            isOverBudget: finalProjectTotal > totalBudget,
            overBudgetAmount: finalProjectTotal > totalBudget ? finalProjectTotal - totalBudget : 0,
            budgetUtilizationPercent: totalBudget > 0 
              ? ((finalProjectTotal / totalBudget) * 100).toFixed(2) + '%'
              : 'N/A'
          }
        };
      });
    } else {
      // Even without full breakdown, include basic totals
      transformedProjects = projects.map(project => ({
        ...project,
        projectTotal: project.projectTotal || 0,
        extracost: project.extracost || 0,
        finalProjectTotal: (project.projectTotal || 0) + (project.extracost || 0)
      }));
    }

    res.json({
      success: true,
      data: transformedProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error("Get Projects Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const projectId = new mongoose.Types.ObjectId(req.params.id);
    
    const pipeline = [
      // Match the specific project
      {
        $match: {
          _id: projectId
        }
      },
      
      // Lookup client details
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "client"
        }
      },
      {
        $unwind: {
          path: "$client",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Lookup site manager details
      {
        $lookup: {
          from: "users",
          localField: "site_manager",
          foreignField: "_id",
          as: "site_manager"
        }
      },
      {
        $unwind: {
          path: "$site_manager",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Lookup labour details
      {
        $lookup: {
          from: "users",
          localField: "labour",
          foreignField: "_id",
          as: "labour"
        }
      },
      
      // Lookup createdBy details
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Get attribute sets
      {
        $lookup: {
          from: "attributesets",
          localField: "AttributeSet",
          foreignField: "_id",
          as: "attributeSets"
        }
      },
      
      // Process each attribute set
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: { $ifNull: ["$attributeSets", []] },
              as: "set",
              in: {
                $mergeObjects: [
                  "$$set",
                  {
                    attributes: {
                      $map: {
                        input: { $ifNull: ["$$set.attributes", []] },
                        as: "attr",
                        in: {
                          $mergeObjects: [
                            "$$attr",
                            {
                              attributeId: "$$attr.attribute",
                              quantity: { $ifNull: ["$$attr.quantity", 1] }
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // Lookup all attributes
      {
        $lookup: {
          from: "attributes",
          let: { 
            attributeIds: {
              $reduce: {
                input: "$attributeSets",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    {
                      $map: {
                        input: { $ifNull: ["$$this.attributes", []] },
                        as: "attr",
                        in: "$$attr.attributeId"
                      }
                    }
                  ]
                }
              }
            }
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$attributeIds"] }
              }
            },
            {
              $project: {
                _id: 1,
                label: 1,
                type: 1,
                pricing: 1
              }
            }
          ],
          as: "allAttributes"
        }
      },
      
      // Create attribute map
      {
        $addFields: {
          attributeMap: {
            $arrayToObject: {
              $map: {
                input: "$allAttributes",
                as: "attr",
                in: {
                  k: { $toString: "$$attr._id" },
                  v: "$$attr"
                }
              }
            }
          }
        }
      },
      
      // Reconstruct attribute sets with populated attributes
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                _id: "$$set._id",
                name: "$$set.name",
                createdBy: "$$set.createdBy",
                createdAt: "$$set.createdAt",
                updatedAt: "$$set.updatedAt",
                __v: "$$set.__v",
                attributes: {
                  $map: {
                    input: { $ifNull: ["$$set.attributes", []] },
                    as: "attr",
                    in: {
                      _id: "$$attr._id",
                      quantity: "$$attr.quantity",
                      attribute: {
                        $ifNull: [
                          { $getField: { field: { $toString: "$$attr.attributeId" }, input: "$attributeMap" } },
                          null
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      // Calculate totals for each attribute set
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                $mergeObjects: [
                  "$$set",
                  {
                    setTotal: {
                      $sum: {
                        $map: {
                          input: { $ifNull: ["$$set.attributes", []] },
                          as: "attr",
                          in: {
                            $multiply: [
                              { $ifNull: ["$$attr.attribute.pricing", 0] },
                              { $ifNull: ["$$attr.quantity", 1] }
                            ]
                          }
                        }
                      }
                    },
                    attributeCount: { $size: { $ifNull: ["$$set.attributes", []] } },
                    validAttributes: {
                      $size: {
                        $filter: {
                          input: { $ifNull: ["$$set.attributes", []] },
                          as: "attr",
                          cond: { $ne: ["$$attr.attribute", null] }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // Calculate project total from attribute sets
      {
        $addFields: {
          projectTotal: {
            $sum: "$attributeSets.setTotal"
          }
        }
      },
      
      // Add percentages for attribute sets
      {
        $addFields: {
          attributeSets: {
            $map: {
              input: "$attributeSets",
              as: "set",
              in: {
                $mergeObjects: [
                  "$$set",
                  {
                    percentageOfTotal: {
                      $cond: {
                        if: { $gt: ["$projectTotal", 0] },
                        then: {
                          $concat: [
                            { $toString: { $round: [{ $multiply: [{ $divide: ["$$set.setTotal", "$projectTotal"] }, 100] }, 2] } },
                            "%"
                          ]
                        },
                        else: "0%"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // Calculate final total including extracost
      {
        $addFields: {
          finalProjectTotal: {
            $add: [
              { $ifNull: ["$projectTotal", 0] },
              { $ifNull: ["$extracost", 0] }
            ]
          }
        }
      },
      
      // Clean up temporary fields
      {
        $project: {
          allAttributes: 0,
          attributeMap: 0
        }
      }
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
        message: "Not authorized to view this project",
      });
    }

    // Calculate base values
    const projectTotal = project.projectTotal || 0;
    const extracost = project.extracost || 0;
    const finalProjectTotal = project.finalProjectTotal || (projectTotal + extracost);
    const totalBudget = project.budget || 0;

    // Calculate phase weightages
    const phaseWeightages = {
      'FOUNDATION': 0.20,
      'STRUCTURE': 0.40,
      'FINISHING': 0.30,
      'HANDOVER': 0.10
    };

    // Build enhanced project with complete budget breakdown
    const enhancedProject = {
      ...project,
      
      // All three totals
      projectTotal,
      extracost,
      finalProjectTotal,
      
      // Complete budget breakdown
      budgetBreakdown: {
        // Main cost components
        totalAttributesValue: projectTotal,
        extracostValue: extracost,
        finalTotalValue: finalProjectTotal,
        
        // Detailed attribute sets with items
        attributeSets: (project.attributeSets || []).map(set => {
          // Calculate per-set statistics
          const setAttributes = (set.attributes || []).map(attr => ({
            _id: attr.attribute?._id,
            label: attr.attribute?.label || 'Unknown',
            type: attr.attribute?.type || 'unknown',
            unitPrice: attr.attribute?.pricing || 0,
            quantity: attr.quantity || 1,
            totalPrice: (attr.attribute?.pricing || 0) * (attr.quantity || 1),
            isValid: !!attr.attribute
          }));

          return {
            _id: set._id,
            name: set.name,
            totalPricing: set.setTotal || 0,
            attributeCount: set.attributeCount || 0,
            validAttributes: set.validAttributes || 0,
            attributes: setAttributes,
            percentageOfTotal: projectTotal > 0 
              ? (((set.setTotal || 0) / projectTotal) * 100).toFixed(2) + '%' 
              : "0%"
          };
        }),
        
        // Summary statistics
        summary: {
          totalItems: (project.attributeSets || []).reduce((acc, set) => 
            acc + (set.attributeCount || 0), 0),
          totalValidItems: (project.attributeSets || []).reduce((acc, set) => 
            acc + (set.validAttributes || 0), 0),
          totalInvalidItems: (project.attributeSets || []).reduce((acc, set) => 
            acc + ((set.attributeCount || 0) - (set.validAttributes || 0)), 0),
          averagePricePerItem: (project.attributeSets || []).reduce((acc, set) => 
            acc + (set.attributeCount || 0), 0) > 0 
            ? (projectTotal / (project.attributeSets || []).reduce((acc, set) => 
                acc + (set.attributeCount || 0), 0)).toFixed(2) 
            : "0.00"
        },
        
        // Budget utilization against project budget
        budgetUtilization: {
          totalBudget,
          allocatedValue: projectTotal,
          extracost,
          finalTotal: finalProjectTotal,
          remainingBudget: totalBudget - finalProjectTotal,
          allocatedPercentage: totalBudget > 0 
            ? ((projectTotal / totalBudget) * 100).toFixed(2) + '%' 
            : '0%',
          finalTotalPercentage: totalBudget > 0 
            ? ((finalProjectTotal / totalBudget) * 100).toFixed(2) + '%' 
            : '0%',
          status: totalBudget === 0 ? 'NO_BUDGET' :
                  finalProjectTotal > totalBudget ? 'OVER_BUDGET' : 
                  finalProjectTotal === totalBudget ? 'FULLY_ALLOCATED' : 
                  'WITHIN_BUDGET',
          utilizationRatio: totalBudget > 0 
            ? (finalProjectTotal / totalBudget).toFixed(2) 
            : '0.00'
        }
      },
      
      // Phase budget allocation
      phaseBudgetAllocation: (project.phases || []).map((phase, index) => {
        const phaseName = phase.phaseName;
        const weightage = phaseWeightages[phaseName] || 0;
        const allocatedBudget = totalBudget * weightage;
        
        // Calculate spent budget based on completion
        let spentBudget = 0;
        if (phase.isCompleted) {
          spentBudget = allocatedBudget; // Full allocation if completed
        } else if (phase.completionPercentage > 0) {
          spentBudget = (allocatedBudget * phase.completionPercentage) / 100;
        }

        return {
          phaseName: phase.phaseName,
          completionPercentage: phase.completionPercentage || 0,
          isCompleted: phase.isCompleted || false,
          allocatedBudget: Math.round(allocatedBudget),
          spentBudget: Math.round(spentBudget),
          remainingBudget: Math.round(allocatedBudget - spentBudget),
          weightage: `${weightage * 100}%`,
          // Show if phase costs are within allocation
          isOverBudget: spentBudget > allocatedBudget
        };
      }),
      
      // Additional financial metrics
      financialMetrics: {
        // Cost breakdown by type
        costByType: (project.attributeSets || []).reduce((acc, set) => {
          (set.attributes || []).forEach(attr => {
            if (attr.attribute?.type) {
              const type = attr.attribute.type;
              const amount = (attr.attribute.pricing || 0) * (attr.quantity || 1);
              acc[type] = (acc[type] || 0) + amount;
            }
          });
          return acc;
        }, {}),
        
        // ROI and efficiency metrics (if applicable)
        costPerPhase: totalBudget > 0 && project.phases 
          ? (finalProjectTotal / project.phases.length).toFixed(2)
          : '0.00',
        
        // Budget efficiency
        budgetEfficiency: totalBudget > 0 && finalProjectTotal > 0
          ? ((finalProjectTotal / totalBudget) * 100).toFixed(2) + '%'
          : '0%'
      }
    };

    // Log for debugging (optional)
    console.log('Budget Breakdown Summary:', {
      projectTotal: enhancedProject.projectTotal,
      extracost: enhancedProject.extracost,
      finalTotal: enhancedProject.finalProjectTotal,
      budget: enhancedProject.budget,
      status: enhancedProject.budgetBreakdown.budgetUtilization.status
    });

    res.json({
      success: true,
      data: enhancedProject,
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

    // ✅ Populate response
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
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalextracost: { $sum: "$extracost" },
          averageProgress: { $avg: "$progressPercentage" },
          projectsByStatus: { $push: "$projectStatus" }, // Fixed: was siteStatus
          projectsByApproval: { $push: "$approvalStatus" },
        },
      },
      {
        $project: {
          totalProjects: 1,
          totalextracost: 1,
          averageProgress: { $round: ["$averageProgress", 2] },
          projectStatusBreakdown: {
            // Fixed: was siteStatusBreakdown
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
        totalextracost: 0,
        averageProgress: 0,
        projectStatusBreakdown: {
          // Fixed: was siteStatusBreakdown
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

// Add new endpoint to update phase completion
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
