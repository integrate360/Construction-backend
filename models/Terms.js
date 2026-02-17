const mongoose = require('mongoose');

const TermsSchema = new mongoose.Schema({
  title:         { type: String, default: 'Standard Terms & Conditions' },
  paymentTerms:  { type: String },
  deliveryTerms: { type: String },
  warrantyTerms: { type: String },
  delayPenalty:  { type: String },
  otherClauses:  { type: String },
  version:       { type: Number, default: 1 },
  isActive:      { type: Boolean, default: true },
  updatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Terms', TermsSchema);
