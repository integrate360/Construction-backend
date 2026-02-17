const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Client name is required'], trim: true },
  email:       { type: String, lowercase: true },
  phone:       { type: String },
  address:     { type: String },
  panNumber:   { type: String },   // Encrypted in production
  aadharNumber:{ type: String },   // Encrypted in production
  gstNumber:   { type: String },
  companyName: { type: String },
  notes:       { type: String },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
