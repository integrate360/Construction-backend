const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
  timestamp:   { type: Date, default: Date.now },
  sensorType:  { type: String },
  value:       { type: mongoose.Schema.Types.Mixed },
  unit:        { type: String },
  alert:       { type: Boolean, default: false },
  alertMessage:{ type: String },
});

const IoTDeviceSchema = new mongoose.Schema({
  deviceName:   { type: String, required: [true, 'Device name is required'] },
  deviceType: {
    type: String,
    enum: ['environmental', 'safety', 'material_tracking', 'equipment', 'camera'],
    required: true
  },
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  location:     { type: String },
  installedDate:{ type: Date },
  status:       { type: String, enum: ['active', 'inactive', 'maintenance', 'faulty'], default: 'active' },
  batteryLevel: { type: Number, min: 0, max: 100 },
  lastSync:     { type: Date },
  ipAddress:    { type: String },
  firmware:     { type: String },
  sensorReadings: [SensorReadingSchema],
  authToken:    { type: String, select: false },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('IoTDevice', IoTDeviceSchema);
