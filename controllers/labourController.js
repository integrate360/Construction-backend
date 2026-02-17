const Labour = require('../models/Labour');

exports.getByProject = async (req, res) => {
  try {
    const labours = await Labour.find({ project: req.params.projectId, isActive: true });
    res.json({ success: true, count: labours.length, data: labours });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id).populate('project', 'projectName');
    if (!labour) return res.status(404).json({ success: false, message: 'Labour not found' });
    res.json({ success: true, data: labour });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const labour = await Labour.create(req.body);
    res.status(201).json({ success: true, data: labour });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const labour = await Labour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!labour) return res.status(404).json({ success: false, message: 'Labour not found' });
    res.json({ success: true, data: labour });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// Mark attendance for a day
exports.markAttendance = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) return res.status(404).json({ success: false, message: 'Labour not found' });

    const { date, status, hoursWorked, overtimeHours, remarks } = req.body;
    const dailyWage   = req.body.dailyWage || labour.dailyWage;
    const overtimePay = (overtimeHours || 0) * (dailyWage / 8) * 1.5;
    let totalPay = 0;

    if (status === 'present')   totalPay = dailyWage + overtimePay;
    if (status === 'half_day')  totalPay = dailyWage / 2 + overtimePay;
    if (status === 'overtime')  totalPay = dailyWage + overtimePay;

    const attendanceRecord = { date, status, hoursWorked: hoursWorked || 8, overtimeHours: overtimeHours || 0, dailyWage, overtimePay, totalPay, remarks, markedBy: req.user.id };
    labour.attendance.push(attendanceRecord);
    labour.totalEarnings = labour.attendance.reduce((s, a) => s + (a.totalPay || 0), 0);
    await labour.save();
    res.status(201).json({ success: true, data: labour });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// Get attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) return res.status(404).json({ success: false, message: 'Labour not found' });
    const summary = {
      totalDays:    labour.attendance.length,
      presentDays:  labour.attendance.filter(a => a.status === 'present').length,
      absentDays:   labour.attendance.filter(a => a.status === 'absent').length,
      halfDays:     labour.attendance.filter(a => a.status === 'half_day').length,
      totalEarnings:labour.totalEarnings,
      totalPaid:    labour.totalPaid,
      balanceDue:   labour.totalEarnings - labour.totalPaid,
    };
    res.json({ success: true, data: summary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Labour.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Labour removed from project' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
