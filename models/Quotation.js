const mongoose = require('mongoose');

const QuotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  unit:        { type: String },
  quantity:    { type: Number, default: 1 },
  rate:        { type: Number, required: true },
  total:       { type: Number },
});

const QuotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, unique: true },
  project:         { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  client:          { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items:           [QuotationItemSchema],
  totalAmount:     { type: Number, default: 0 },
  taxAmount:       { type: Number, default: 0 },
  grandTotal:      { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'revised'],
    default: 'draft'
  },
  validUntil:  { type: Date },
  notes:       { type: String },
  termsRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'Terms' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

QuotationSchema.pre('save', function (next) {
  if (!this.quotationNumber) {
    this.quotationNumber = 'QT-' + Date.now();
  }
  this.items.forEach(item => { item.total = item.quantity * item.rate; });
  this.totalAmount = this.items.reduce((s, i) => s + (i.total || 0), 0);
  this.grandTotal  = this.totalAmount + this.taxAmount;
  next();
});

module.exports = mongoose.model('Quotation', QuotationSchema);
