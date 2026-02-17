const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  date:        { type: Date, required: true },
  status:      { type: String, enum: ['present', 'absent', 'half_day', 'overtime'], default: 'present' },
  hoursWorked: { type: Number, default: 8 },
  overtimeHours:{ type: Number, default: 0 },
  dailyWage:   { type: Number },
  overtimePay: { type: Number, default: 0 },
  totalPay:    { type: Number },
  remarks:     { type: String },
  markedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const LabourSchema = new mongoose.Schema({
  name:           { type: String, required: [true, 'Labour name is required'], trim: true },
  phone:          { type: String },
  aadharNumber:   { type: String },
  labourType:     { type: String, enum: ['in_house', 'sub_contract'], required: true },
  contractorName: { type: String }, // Only for sub_contract
  workType:       { type: String, required: true },
  dailyWage:      { type: Number, required: true },
  project:        { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  phase:          { type: Number, enum: [1, 2, 3, 4] },
  attendance:     [AttendanceSchema],
  paymentStatus:  { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  totalEarnings:  { type: Number, default: 0 },
  totalPaid:      { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Labour', LabourSchema);
