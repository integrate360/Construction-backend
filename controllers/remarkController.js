const Remark = require('../models/Remark');

exports.getByProject = async (req, res) => {
  try {
    const remarks = await Remark.find({ project: req.params.projectId })
      .populate('createdBy', 'name').sort('-createdAt');
    res.json({ success: true, data: remarks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const remark = await Remark.create(req.body);
    res.status(201).json({ success: true, data: remark });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const remark = await Remark.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!remark) return res.status(404).json({ success: false, message: 'Remark not found' });
    res.json({ success: true, data: remark });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Remark.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Remark deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
