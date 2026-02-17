const Material = require('../models/Material');

exports.getByProject = async (req, res) => {
  try {
    const { phase } = req.query;
    const materials = await Material.find({ project: req.params.projectId });
    const report = materials.map(m => {
      const phaseTransactions = phase
        ? m.transactions.filter(t => t.phase === parseInt(phase))
        : m.transactions;
      return {
        _id:           m._id,
        materialName:  m.materialName,
        unit:          m.unit,
        category:      m.category,
        totalReceived: m.totalReceived,
        totalUsed:     m.totalUsed,
        totalWastage:  m.totalWastage,
        balanceOnHand: m.balanceOnHand,
        totalCost:     m.totalCost,
        phaseDetails:  phase ? { phase: parseInt(phase), transactions: phaseTransactions } : undefined,
      };
    });
    res.json({ success: true, count: materials.length, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, data: material });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const material = await Material.create(req.body);
    res.status(201).json({ success: true, data: material });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.addTransaction = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const txn = { ...req.body, recordedBy: req.user.id };
    if (txn.unitCost && txn.quantity) txn.totalCost = txn.unitCost * txn.quantity;
    material.transactions.push(txn);
    material.recalculateStock();
    await material.save();
    res.status(201).json({ success: true, data: material });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
