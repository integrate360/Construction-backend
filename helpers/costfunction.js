import Project from "../models/Project.js";

const calculateBudgetBreakdown = (attributeSets) => {
  if (!attributeSets || !Array.isArray(attributeSets) || attributeSets.length === 0) {
    return {
      totalAttributesValue: 0,
      attributeSets: [],
      summary: {
        byType: {},
        totalItems: 0,
        averagePricePerItem: "0.00"
      }
    };
  }

  let totalAttributesValue = 0;
  const typeSummary = {};
  let totalItems = 0;

  const attributeSetsWithTotals = attributeSets.map(set => {
    // Skip if set doesn't have attributes
    if (!set.attributes || !Array.isArray(set.attributes)) {
      return {
        _id: set._id,
        name: set.name || "Unknown Set",
        totalPricing: 0,
        attributeCount: 0,
        attributes: [],
        percentageOfTotal: "0%"
      };
    }

    let setTotal = 0;
    const attributesWithDetails = [];

    set.attributes.forEach(item => {
      // Get the populated attribute
      const attribute = item.attribute;
      
      // Skip if attribute is not populated
      if (!attribute || typeof attribute !== 'object') {
        console.log("Skipping unpopulated attribute:", item);
        return;
      }

      const unitPrice = attribute.pricing || 0;
      const quantity = item.quantity || 1;
      const totalPrice = unitPrice * quantity;

      setTotal += totalPrice;
      totalAttributesValue += totalPrice;
      totalItems++;

      // Track by type for summary
      const type = attribute.type || 'unknown';
      if (!typeSummary[type]) {
        typeSummary[type] = {
          totalCost: 0,
          count: 0,
          items: []
        };
      }
      typeSummary[type].totalCost += totalPrice;
      typeSummary[type].count++;
      typeSummary[type].items.push({
        label: attribute.label,
        pricing: unitPrice,
        quantity: quantity,
        totalCost: totalPrice
      });

      attributesWithDetails.push({
        _id: attribute._id,
        label: attribute.label,
        type: attribute.type,
        pricing: unitPrice,
        quantity: quantity,
        totalPrice: totalPrice,
        unitPrice: unitPrice
      });
    });

    return {
      _id: set._id,
      name: set.name,
      totalPricing: setTotal,
      attributeCount: attributesWithDetails.length,
      attributes: attributesWithDetails,
      percentageOfTotal: "0%" // Will calculate after total is known
    };
  });

  // Calculate percentages after total is known
  const attributeSetsWithPercentage = attributeSetsWithTotals.map(set => ({
    ...set,
    percentageOfTotal: totalAttributesValue > 0 
      ? ((set.totalPricing / totalAttributesValue) * 100).toFixed(2) + '%' 
      : '0%'
  }));

  // Calculate average price per item
  const averagePricePerItem = totalItems > 0 
    ? (totalAttributesValue / totalItems).toFixed(2) 
    : "0.00";

  return {
    totalAttributesValue,
    attributeSets: attributeSetsWithPercentage,
    summary: {
      byType: typeSummary,
      totalItems,
      averagePricePerItem
    }
  };
};

const calculatePhaseBudgetAllocation = (phases, totalBudget) => {
  if (!phases || phases.length === 0 || !totalBudget) return [];

  // Define phase weightage (customize these percentages as needed)
  const phaseWeightage = {
    FOUNDATION: 0.2, // 20% of total budget
    STRUCTURE: 0.4,  // 40% of total budget
    FINISHING: 0.3,  // 30% of total budget
    HANDOVER: 0.1,   // 10% of total budget
  };

  return phases.map((phase) => {
    const allocatedBudget = totalBudget * (phaseWeightage[phase.phaseName] || 0);
    const spentBudget = allocatedBudget * (phase.completionPercentage / 100);

    return {
      phaseName: phase.phaseName,
      completionPercentage: phase.completionPercentage,
      isCompleted: phase.isCompleted,
      allocatedBudget: Math.round(allocatedBudget),
      spentBudget: Math.round(spentBudget),
      remainingBudget: Math.round(allocatedBudget - spentBudget),
      weightage: ((phaseWeightage[phase.phaseName] || 0) * 100).toFixed(0) + '%',
    };
  });
};

// In your project controller, update the calculation functions

const calculateTotalProjectCost = (project) => {
  // Get attribute sets (handle both field names)
  const attributeSets = project.AttributeSet || project.attributeSets;
  
  if (!attributeSets || !Array.isArray(attributeSets) || attributeSets.length === 0) {
    return {
      totalCost: 0,
      breakdown: [],
      summary: {
        totalSets: 0,
        totalAttributes: 0,
      },
    };
  }

  let totalCost = 0;
  const breakdown = [];
  let totalAttributes = 0;
  const typeSummary = {};

  for (const attributeSet of attributeSets) {
    // Check if attributeSet is populated
    if (!attributeSet.attributes || !Array.isArray(attributeSet.attributes)) {
      console.log("Skipping unpopulated attribute set:", attributeSet._id);
      continue;
    }

    let setTotal = 0;
    const attributeCosts = [];
    const setAttributes = [];

    for (const item of attributeSet.attributes) {
      // Extract attribute and quantity
      const attribute = item.attribute || item;
      const quantity = item.quantity || 1; // Default to 1 if not specified
      
      // Skip if attribute is not populated
      if (!attribute || !attribute.pricing) {
        console.log("Skipping unpopulated attribute");
        continue;
      }

      const unitPrice = attribute.pricing;
      const totalPrice = unitPrice * quantity;
      
      setTotal += totalPrice;
      totalAttributes++;

      // Track by type for summary
      const type = attribute.type || 'unknown';
      if (!typeSummary[type]) {
        typeSummary[type] = {
          totalCost: 0,
          count: 0,
          items: []
        };
      }
      typeSummary[type].totalCost += totalPrice;
      typeSummary[type].count++;
      typeSummary[type].items.push({
        label: attribute.label,
        unitPrice: unitPrice,
        quantity: quantity,
        totalCost: totalPrice
      });

      attributeCosts.push({
        attributeId: attribute._id,
        label: attribute.label,
        type: attribute.type,
        unitPrice: unitPrice,
        quantity: quantity,
        totalCost: totalPrice,
      });

      setAttributes.push({
        label: attribute.label,
        quantity: quantity,
        unitPrice: unitPrice,
        total: totalPrice
      });
    }

    totalCost += setTotal;
    breakdown.push({
      attributeSetId: attributeSet._id,
      attributeSetName: attributeSet.name,
      setTotal: setTotal,
      attributeCount: attributeCosts.length,
      attributes: attributeCosts,
      details: setAttributes,
      percentageOfTotal: totalCost > 0 ? ((setTotal / totalCost) * 100).toFixed(2) + '%' : '0%'
    });
  }

  return {
    totalCost,
    breakdown,
    summary: {
      totalSets: breakdown.length,
      totalAttributes,
      byType: typeSummary,
      averageCostPerAttribute: totalAttributes > 0 ? (totalCost / totalAttributes).toFixed(2) : 0
    },
  };
};

const calculateBudgetUtilization = (budget, totalCost) => {
  const projectBudget = budget || 0;
  const allocatedPercentage = projectBudget > 0 
    ? ((totalCost / projectBudget) * 100).toFixed(2) 
    : '0.00';
    
  return {
    totalBudget: projectBudget,
    totalCalculatedCost: totalCost,
    difference: projectBudget - totalCost,
    isOverBudget: totalCost > projectBudget,
    allocatedPercentage: allocatedPercentage + '%',
    status: totalCost > projectBudget ? 'OVER_BUDGET' : 
            totalCost === projectBudget ? 'FULLY_ALLOCATED' : 'WITHIN_BUDGET',
    budgetConsumptionRatio: (totalCost / projectBudget).toFixed(2)
  };
};
// Optional: Get only budget breakdown
 const getProjectBudgetBreakdown = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: "AttributeSet",
        populate: {
          path: "attributes.attribute",
          model: "Attribute",
          select: "label type pricing"
        }
      })
      .select("budget AttributeSet phases projectName");

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

    const budgetBreakdown = calculateBudgetBreakdown(project.AttributeSet);
    const totalBudget = project.budget || 0;
    const phaseAllocation = calculatePhaseBudgetAllocation(project.phases, totalBudget);

    res.json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.projectName,
        totalBudget,
        budgetBreakdown: {
          ...budgetBreakdown,
          budgetUtilization: {
            totalBudget,
            allocatedValue: budgetBreakdown.totalAttributesValue,
            remainingBudget: totalBudget - budgetBreakdown.totalAttributesValue,
            allocatedPercentage: totalBudget > 0 
              ? ((budgetBreakdown.totalAttributesValue / totalBudget) * 100).toFixed(2) + '%' 
              : '0%',
            status: budgetBreakdown.totalAttributesValue > totalBudget 
              ? 'OVER_BUDGET' 
              : budgetBreakdown.totalAttributesValue === totalBudget 
                ? 'FULLY_ALLOCATED' 
                : 'WITHIN_BUDGET'
          }
        },
        phaseBudgetAllocation: phaseAllocation
      }
    });
  } catch (error) {
    console.error("Get Budget Breakdown Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { getProjectBudgetBreakdown, calculateBudgetBreakdown, calculatePhaseBudgetAllocation, calculateTotalProjectCost, calculateBudgetUtilization };