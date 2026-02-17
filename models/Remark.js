const mongoose = require('mongoose');

const RemarkSchema = new mongoose.Schema({
  project:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  remarkText: { type: String, required: [true, 'Remark text is required'] },
  category:   { type: String, enum: ['general', 'safety', 'quality', 'finance', 'delay'], default: 'general' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Remark', RemarkSchema);
