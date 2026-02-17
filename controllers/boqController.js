const BOQ = require('../models/BOQ');

exports.getByProject = async (req, res) => {
  try {
    const boqs = await BOQ.find({ project: req.params.projectId }).populate('createdBy', 'name');
    res.json({ success: true, data: boqs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id).populate('project', 'projectName').populate('approvedBy', 'name');
    if (!boq) return res.status(404).json({ success: false, message: 'BOQ not found' });
    res.json({ success: true, data: boq });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const boq = new BOQ(req.body);
    // Calculate item totals
    boq.items.forEach(item => {
      item.clientTotal   = item.quantity * item.clientRate;
      item.internalTotal = item.quantity * item.internalCost;
      item.profitPerItem = item.clientRate - item.internalCost;
      item.profitPercent = item.clientRate > 0 ? parseFloat(((item.profitPerItem / item.clientRate) * 100).toFixed(2)) : 0;
    });
    boq.recalculateTotals();
    await boq.save();
    res.status(201).json({ success: true, data: boq });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.addItem = async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ success: false, message: 'BOQ not found' });
    const item = req.body;
    item.clientTotal   = item.quantity * item.clientRate;
    item.internalTotal = item.quantity * item.internalCost;
    item.profitPerItem = item.clientRate - item.internalCost;
    item.profitPercent = item.clientRate > 0 ? parseFloat(((item.profitPerItem / item.clientRate) * 100).toFixed(2)) : 0;
    boq.items.push(item);
    boq.recalculateTotals();
    await boq.save();
    res.status(201).json({ success: true, data: boq });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.updateItem = async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ success: false, message: 'BOQ not found' });
    const itemIdx = boq.items.findIndex(i => i._id.toString() === req.params.itemId);
    if (itemIdx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
    Object.assign(boq.items[itemIdx], req.body);
    const item = boq.items[itemIdx];
    item.clientTotal   = item.quantity * item.clientRate;
    item.internalTotal = item.quantity * item.internalCost;
    item.profitPerItem = item.clientRate - item.internalCost;
    item.profitPercent = item.clientRate > 0 ? parseFloat(((item.profitPerItem / item.clientRate) * 100).toFixed(2)) : 0;
    boq.recalculateTotals();
    await boq.save();
    res.json({ success: true, data: boq });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteItem = async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ success: false, message: 'BOQ not found' });
    boq.items = boq.items.filter(i => i._id.toString() !== req.params.itemId);
    boq.recalculateTotals();
    await boq.save();
    res.json({ success: true, data: boq });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Rate Difference Monitoring
exports.getRateDifference = async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ success: false, message: 'BOQ not found' });
    const rateReport = boq.items.map(item => ({
      boqItem:        item.itemName,
      clientRate:     item.clientRate,
      executionRate:  item.internalCost,
      difference:     item.clientRate - item.internalCost,
      totalSaving:    (item.clientRate - item.internalCost) * item.quantity,
    }));
    res.json({ success: true, data: rateReport });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const boq = await BOQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!boq) return res.status(404).json({ success: false, message: 'BOQ not found' });
    res.json({ success: true, data: boq });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await BOQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'BOQ deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
