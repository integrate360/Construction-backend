const Project = require('../models/Project');
const BOQ = require('../models/BOQ');
const Labour = require('../models/Labour');
const Material = require('../models/Material');

// @desc  Finance dashboard | GET /api/finance/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const projects = await Project.find({ status: { $nin: ['cancelled'] } }).populate('client', 'name');
    const boqs      = await BOQ.find();
    const labours   = await Labour.find({ isActive: true });
    const materials = await Material.find();

    const totalBOQValue    = boqs.reduce((s, b) => s + b.totalBOQValue, 0);
    const totalActualCost  = boqs.reduce((s, b) => s + b.totalActualCost, 0);
    const totalLabourCost  = labours.reduce((s, l) => s + l.totalEarnings, 0);
    const totalMaterialCost= materials.reduce((s, m) => s + m.totalCost, 0);
    const boqProfit        = totalBOQValue - totalActualCost;
    const profitPercentage = totalBOQValue > 0 ? parseFloat(((boqProfit / totalBOQValue) * 100).toFixed(2)) : 0;

    const projectSummary = await Promise.all(projects.map(async (p) => {
      const pBoqs      = boqs.filter(b => b.project.toString() === p._id.toString());
      const pLabours   = labours.filter(l => l.project.toString() === p._id.toString());
      const pMaterials = materials.filter(m => m.project.toString() === p._id.toString());
      const pBoqValue  = pBoqs.reduce((s, b) => s + b.totalBOQValue, 0);
      const pActual    = pBoqs.reduce((s, b) => s + b.totalActualCost, 0);
      const pLabCost   = pLabours.reduce((s, l) => s + l.totalEarnings, 0);
      const pMatCost   = pMaterials.reduce((s, m) => s + m.totalCost, 0);
      return {
        project:      p.projectName,
        client:       p.client?.name,
        totalBudget:  p.totalBudget,
        boqValue:     pBoqValue,
        actualCost:   pActual,
        labourCost:   pLabCost,
        materialCost: pMatCost,
        profit:       pBoqValue - pActual,
        profitPct:    pBoqValue > 0 ? parseFloat((((pBoqValue - pActual) / pBoqValue) * 100).toFixed(2)) : 0,
      };
    }));

    res.json({
      success: true,
      data: {
        summary: { totalBOQValue, totalActualCost, totalLabourCost, totalMaterialCost, boqProfit, profitPercentage },
        projectSummary,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Execution phase monitoring | GET /api/finance/execution/:projectId
exports.getExecutionMonitoring = async (req, res) => {
  try {
    const project   = await Project.findById(req.params.projectId);
    if (!project)   return res.status(404).json({ success: false, message: 'Project not found' });

    const labours   = await Labour.find({ project: req.params.projectId });
    const materials = await Material.find({ project: req.params.projectId });
    const boq       = await BOQ.findOne({ project: req.params.projectId });

    const phaseData = [1, 2, 3, 4].map(phase => {
      const labCost = labours.reduce((s, l) => {
        const phaseAtt = l.attendance.filter(a => true); // filter by phase if tracked
        return s + phaseAtt.reduce((ps, a) => ps + (a.totalPay || 0), 0);
      }, 0);
      const matCost = materials.reduce((s, m) => {
        return s + m.transactions.filter(t => t.phase === phase && t.transactionType === 'received')
          .reduce((ms, t) => ms + (t.totalCost || 0), 0);
      }, 0);
      return { phase, labourCost: labCost, materialCost: matCost, totalCost: labCost + matCost };
    });

    const totalLabour   = labours.reduce((s, l) => s + l.totalEarnings, 0);
    const totalMaterial = materials.reduce((s, m) => s + m.totalCost, 0);
    const totalCost     = totalLabour + totalMaterial;
    const boqValue      = boq ? boq.totalBOQValue : 0;
    const profit        = boqValue - totalCost;
    const profitPct     = boqValue > 0 ? parseFloat(((profit / boqValue) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        project:    project.projectName,
        boqValue,
        totalLabourCost:   totalLabour,
        totalMaterialCost: totalMaterial,
        totalActualCost:   totalCost,
        budget:     project.totalBudget,
        budgetVariance: project.totalBudget - totalCost,
        profitRunning:  profit,
        profitPercentage: profitPct,
        phaseWiseCosts: phaseData,
        completionPercentage: project.completionPercentage,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
