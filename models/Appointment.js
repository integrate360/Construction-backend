const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Title is required'] },
  location:    { type: String },
  meetingTime: { type: Date, required: [true, 'Meeting time is required'] },
  reminderTime:{ type: Date },
  notes:       { type: String },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  attendees:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status:      { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
