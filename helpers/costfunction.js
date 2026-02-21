
const calculateBudgetBreakdown = (attributeSets) => {
  if (!attributeSets || attributeSets.length === 0) {
    return {
      totalAttributesValue: 0,
      attributeSets: [],
      summary: {
        byType: {},
        totalItems: 0
      }
    };
  }

  let totalAttributesValue = 0;
  const typeSummary = {};
  let totalItems = 0;

  const attributeSetsWithTotals = attributeSets.map(set => {
    let setTotal = 0;
    const attributesWithDetails = set.attributes.map(attr => {
      const pricing = attr.pricing || 0;
      setTotal += pricing;
      totalAttributesValue += pricing;
      totalItems++;

      // Group by type for summary
      if (attr.type) {
        if (!typeSummary[attr.type]) {
          typeSummary[attr.type] = {
            total: 0,
            count: 0,
            items: []
          };
        }
        typeSummary[attr.type].total += pricing;
        typeSummary[attr.type].count++;
        typeSummary[attr.type].items.push({
          label: attr.label,
          pricing: pricing
        });
      }

      return {
        _id: attr._id,
        label: attr.label,
        type: attr.type,
        pricing: pricing,
        unitPrice: pricing // Assuming pricing is per unit
      };
    });

    return {
      _id: set._id,
      name: set.name,
      totalPricing: setTotal,
      attributeCount: set.attributes.length,
      attributes: attributesWithDetails
    };
  });

  // Calculate percentages
  const attributeSetsWithPercentage = attributeSetsWithTotals.map(set => ({
    ...set,
    percentageOfTotal: ((set.totalPricing / totalAttributesValue) * 100).toFixed(2) + '%'
  }));

  return {
    totalAttributesValue,
    attributeSets: attributeSetsWithPercentage,
    summary: {
      byType: typeSummary,
      totalItems,
      averagePricePerItem: totalItems > 0 ? (totalAttributesValue / totalItems).toFixed(2) : 0
    }
  };
};

const calculatePhaseBudgetAllocation = (phases, totalBudget) => {
  if (!phases || phases.length === 0) return null;

  // Define phase weightage (you can customize these percentages)
  const phaseWeightage = {
    FOUNDATION: 0.20, // 20% of total budget
    STRUCTURE: 0.40,   // 40% of total budget
    FINISHING: 0.30,   // 30% of total budget
    HANDOVER: 0.10     // 10% of total budget
  };

  return phases.map(phase => {
    const allocatedBudget = totalBudget * (phaseWeightage[phase.phaseName] || 0);
    const spentBudget = allocatedBudget * (phase.completionPercentage / 100);
    
    return {
      phaseName: phase.phaseName,
      completionPercentage: phase.completionPercentage,
      isCompleted: phase.isCompleted,
      allocatedBudget: Math.round(allocatedBudget),
      spentBudget: Math.round(spentBudget),
      remainingBudget: Math.round(allocatedBudget - spentBudget),
      weightage: (phaseWeightage[phase.phaseName] * 100).toFixed(0) + '%'
    };
  });
};

export { calculateBudgetBreakdown, calculatePhaseBudgetAllocation };