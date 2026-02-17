const mongoose = require('mongoose');

const BOQItemSchema = new mongoose.Schema({
  itemName:     { type: String, required: true },
  description:  { type: String },
  unit:         { type: String, required: true },
  quantity:     { type: Number, required: true, min: 0 },
  clientRate:   { type: Number, required: true, min: 0 },
  internalCost: { type: Number, required: true, min: 0 },
  // Computed fields
  clientTotal:  { type: Number },
  internalTotal:{ type: Number },
  profitPerItem:{ type: Number },
  profitPercent:{ type: Number },
  phase:        { type: Number, enum: [1, 2, 3, 4] },
  category:     { type: String },
});

BOQItemSchema.pre('save', function (next) {
  this.clientTotal   = this.quantity * this.clientRate;
  this.internalTotal = this.quantity * this.internalCost;
  this.profitPerItem = this.clientRate - this.internalCost;
  this.profitPercent = this.clientRate > 0
    ? parseFloat(((this.profitPerItem / this.clientRate) * 100).toFixed(2))
    : 0;
  next();
});

const BOQSchema = new mongoose.Schema({
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title:        { type: String, default: 'Bill of Quantities' },
  items:        [BOQItemSchema],
  // Totals (auto-calculated)
  totalBOQValue:    { type: Number, default: 0 },
  totalActualCost:  { type: Number, default: 0 },
  totalProfit:      { type: Number, default: 0 },
  profitPercentage: { type: Number, default: 0 },
  version:      { type: Number, default: 1 },
  status:       { type: String, enum: ['draft', 'approved', 'revised'], default: 'draft' },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

BOQSchema.methods.recalculateTotals = function () {
  this.totalBOQValue   = this.items.reduce((s, i) => s + (i.clientTotal || 0), 0);
  this.totalActualCost = this.items.reduce((s, i) => s + (i.internalTotal || 0), 0);
  this.totalProfit     = this.totalBOQValue - this.totalActualCost;
  this.profitPercentage = this.totalBOQValue > 0
    ? parseFloat(((this.totalProfit / this.totalBOQValue) * 100).toFixed(2))
    : 0;
};

module.exports = mongoose.model('BOQ', BOQSchema);
