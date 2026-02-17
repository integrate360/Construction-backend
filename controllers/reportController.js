const Project  = require('../models/Project');
const BOQ      = require('../models/BOQ');
const Labour   = require('../models/Labour');
const Material = require('../models/Material');
const IoTDevice= require('../models/IoTDevice');

// Project Profit Report
exports.projectProfitReport = async (req, res) => {
  try {
    const projects = await Project.find().populate('client', 'name');
    const boqs     = await BOQ.find();
    const report   = projects.map(p => {
      const pBoqs    = boqs.filter(b => b.project.toString() === p._id.toString());
      const boqValue = pBoqs.reduce((s, b) => s + b.totalBOQValue, 0);
      const actual   = pBoqs.reduce((s, b) => s + b.totalActualCost, 0);
      return {
        projectName:  p.projectName,
        client:       p.client?.name,
        budget:       p.totalBudget,
        boqValue,
        actualCost:   actual,
        profit:       boqValue - actual,
        profitPct:    boqValue > 0 ? parseFloat((((boqValue - actual) / boqValue) * 100).toFixed(2)) : 0,
        completion:   p.completionPercentage,
        status:       p.status,
      };
    });
    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Labour Cost Report
exports.labourCostReport = async (req, res) => {
  try {
    const filter = req.query.projectId ? { project: req.query.projectId } : {};
    const labours = await Labour.find(filter).populate('project', 'projectName');
    const report  = labours.map(l => ({
      name:           l.name,
      project:        l.project?.projectName,
      labourType:     l.labourType,
      contractorName: l.contractorName,
      workType:       l.workType,
      totalDays:      l.attendance.length,
      totalEarnings:  l.totalEarnings,
      totalPaid:      l.totalPaid,
      balanceDue:     l.totalEarnings - l.totalPaid,
      paymentStatus:  l.paymentStatus,
    }));
    const totalCost = report.reduce((s, r) => s + r.totalEarnings, 0);
    res.json({ success: true, totalCost, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Site-wise Material Report
exports.materialReport = async (req, res) => {
  try {
    const filter    = req.query.projectId ? { project: req.query.projectId } : {};
    const materials = await Material.find(filter).populate('project', 'projectName');
    const report    = materials.map(m => ({
      project:       m.project?.projectName,
      materialName:  m.materialName,
      unit:          m.unit,
      totalReceived: m.totalReceived,
      totalUsed:     m.totalUsed,
      wastage:       m.totalWastage,
      balanceOnHand: m.balanceOnHand,
      totalCost:     m.totalCost,
    }));
    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// BOQ vs Actual Report
exports.boqVsActualReport = async (req, res) => {
  try {
    const filter = req.query.projectId ? { project: req.query.projectId } : {};
    const boqs   = await BOQ.find(filter).populate('project', 'projectName');
    const report = boqs.map(b => ({
      project:      b.project?.projectName,
      boqValue:     b.totalBOQValue,
      actualCost:   b.totalActualCost,
      profit:       b.totalProfit,
      profitPct:    b.profitPercentage,
      status:       b.status,
      items:        b.items.map(i => ({
        itemName: i.itemName, qty: i.quantity, clientRate: i.clientRate,
        internalCost: i.internalCost, profitPerItem: i.profitPerItem, profitPct: i.profitPercent
      }))
    }));
    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Phase-wise Progress Report
exports.phaseProgressReport = async (req, res) => {
  try {
    const filter   = req.query.projectId ? { _id: req.query.projectId } : {};
    const projects = await Project.find(filter).populate('client', 'name');
    const report   = projects.map(p => ({
      projectName: p.projectName,
      client:      p.client?.name,
      overallCompletion: p.completionPercentage,
      phases: p.phases.map(ph => ({
        phase:      ph.phaseNumber,
        name:       ph.phaseName,
        status:     ph.status,
        completion: ph.completionPercentage,
        costIncurred: ph.costsIncurred,
      }))
    }));
    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// IoT Device Status Report
exports.iotStatusReport = async (req, res) => {
  try {
    const filter  = req.query.projectId ? { project: req.query.projectId } : {};
    const devices = await IoTDevice.find(filter).populate('project', 'projectName');
    const report  = devices.map(d => ({
      deviceName:  d.deviceName,
      deviceType:  d.deviceType,
      project:     d.project?.projectName,
      status:      d.status,
      batteryLevel:d.batteryLevel,
      lastSync:    d.lastSync,
      location:    d.location,
      alertCount:  d.sensorReadings.filter(r => r.alert).length,
    }));
    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
