const Terms = require('../models/Terms');

exports.getActive = async (req, res) => {
  try {
    const terms = await Terms.findOne({ isActive: true }).sort('-createdAt');
    res.json({ success: true, data: terms });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    // Deactivate old terms
    await Terms.updateMany({}, { isActive: false });
    req.body.updatedBy = req.user.id;
    const terms = await Terms.create(req.body);
    res.status(201).json({ success: true, data: terms });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    req.body.updatedBy = req.user.id;
    const terms = await Terms.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!terms) return res.status(404).json({ success: false, message: 'Terms not found' });
    res.json({ success: true, data: terms });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Terms.find().sort('-createdAt');
    res.json({ success: true, data: history });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
