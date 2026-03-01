const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  patientName: {
    type: String,
    trim: true,
    maxlength: [100, 'Patient name cannot exceed 100 characters'],
  },
  bloodGroup: {
    type: String,
    required: [true, 'Please specify the blood group needed'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  hospital: {
    type: String,
    required: [true, 'Please add hospital/clinic name'],
    trim: true,
    maxlength: [200, 'Hospital name cannot exceed 200 characters'],
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true,
  },
  units: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 unit required'],
    max: [50, 'Cannot exceed 50 units'],
  },
  urgency: {
    type: String,
    enum: ['Normal', 'Urgent', 'Critical'],
    default: 'Normal',
  },
  contact: {
    type: String,
    required: [true, 'Please add a contact number'],
  },
  status: {
    type: String,
    enum: ['open', 'completed', 'cancelled'],
    default: 'open',
  },
  requestor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  donor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bloodRequestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ requestor: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
