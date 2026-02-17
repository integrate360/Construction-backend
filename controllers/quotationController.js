const Quotation = require('../models/Quotation');

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId) filter.client = req.query.clientId;
    if (req.query.projectId) filter.project = req.query.projectId;
    const quotations = await Quotation.find(filter)
      .populate('client', 'name').populate('project', 'projectName').populate('createdBy', 'name').sort('-createdAt');
    res.json({ success: true, data: quotations });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id).populate('client').populate('project').populate('termsRef');
    if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: q });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const q = await Quotation.create(req.body);
    res.status(201).json({ success: true, data: q });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const q = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: q });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
