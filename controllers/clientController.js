const Client = require('../models/Client');

exports.getAll = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).populate('createdBy', 'name').sort('-createdAt');
    res.json({ success: true, count: clients.length, data: clients });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('createdBy', 'name');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
