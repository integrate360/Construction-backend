const mongoose = require('mongoose');

const MaterialTransactionSchema = new mongoose.Schema({
  transactionType: { type: String, enum: ['received', 'used', 'returned', 'wasted'], required: true },
  quantity:        { type: Number, required: true },
  date:            { type: Date, default: Date.now },
  phase:           { type: Number, enum: [1, 2, 3, 4] },
  supplier:        { type: String },
  invoiceNumber:   { type: String },
  unitCost:        { type: Number },
  totalCost:       { type: Number },
  notes:           { type: String },
  recordedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const MaterialSchema = new mongoose.Schema({
  materialName:   { type: String, required: [true, 'Material name is required'], trim: true },
  category:       { type: String },
  unit:           { type: String, required: true },
  project:        { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  transactions:   [MaterialTransactionSchema],
  // Computed stock
  totalReceived:  { type: Number, default: 0 },
  totalUsed:      { type: Number, default: 0 },
  totalWastage:   { type: Number, default: 0 },
  balanceOnHand:  { type: Number, default: 0 },
  totalCost:      { type: Number, default: 0 },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

MaterialSchema.methods.recalculateStock = function () {
  this.totalReceived = this.transactions.filter(t => t.transactionType === 'received').reduce((s, t) => s + t.quantity, 0);
  this.totalUsed     = this.transactions.filter(t => t.transactionType === 'used').reduce((s, t) => s + t.quantity, 0);
  this.totalWastage  = this.transactions.filter(t => t.transactionType === 'wasted').reduce((s, t) => s + t.quantity, 0);
  this.balanceOnHand = this.totalReceived - this.totalUsed - this.totalWastage;
  this.totalCost     = this.transactions.filter(t => t.transactionType === 'received').reduce((s, t) => s + (t.totalCost || 0), 0);
};

module.exports = mongoose.model('Material', MaterialSchema);
