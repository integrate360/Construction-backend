const Appointment = require('../models/Appointment');

exports.getAll = async (req, res) => {
  try {
    const filter = req.query.projectId ? { project: req.query.projectId } : {};
    const appointments = await Appointment.find(filter)
      .populate('project', 'projectName').populate('attendees', 'name').populate('createdBy', 'name')
      .sort('meetingTime');
    res.json({ success: true, data: appointments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const appointment = await Appointment.create(req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
