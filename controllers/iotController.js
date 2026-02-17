const IoTDevice = require('../models/IoTDevice');
const crypto = require('crypto');

exports.getByProject = async (req, res) => {
  try {
    const devices = await IoTDevice.find({ project: req.params.projectId }).populate('createdBy', 'name');
    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const device = await IoTDevice.findById(req.params.id).populate('project', 'projectName');
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, data: device });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.authToken = crypto.randomBytes(32).toString('hex'); // Secure device token
    const device = await IoTDevice.create(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const device = await IoTDevice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, data: device });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// Push sensor reading from IoT device
exports.pushReading = async (req, res) => {
  try {
    const device = await IoTDevice.findById(req.params.id).select('+authToken');
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const { value, sensorType, unit } = req.body;
    // Basic threshold alerting
    let alert = false;
    let alertMessage = '';
    if (sensorType === 'temperature' && value > 50) { alert = true; alertMessage = 'High temperature alert'; }
    if (sensorType === 'smoke' && value > 0)         { alert = true; alertMessage = 'Smoke detected!'; }

    device.sensorReadings.push({ sensorType, value, unit, alert, alertMessage });
    // Keep only last 100 readings per device
    if (device.sensorReadings.length > 100) device.sensorReadings = device.sensorReadings.slice(-100);
    device.lastSync = new Date();
    if (req.body.batteryLevel !== undefined) device.batteryLevel = req.body.batteryLevel;
    await device.save();
    res.status(201).json({ success: true, data: { alert, alertMessage } });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getLatestReadings = async (req, res) => {
  try {
    const device = await IoTDevice.findById(req.params.id);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    const latest = device.sensorReadings.slice(-10);
    res.json({ success: true, data: { deviceName: device.deviceName, status: device.status, batteryLevel: device.batteryLevel, lastSync: device.lastSync, readings: latest } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await IoTDevice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Device removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
