const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    patientName: {
        type: String,
    },
    bloodGroup: {
        type: String,
        required: [true, 'Please specify the blood group needed'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    hospital: {
        type: String,
        required: [true, 'Please add hospital/clinic name']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    units: {
        type: Number,
        default: 1
    },
    urgency: {
        type: String,
        enum: ['Normal', 'Urgent', 'Critical'],
        default: 'Normal'
    },
    contact: {
        type: String,
        required: [true, 'Please add a contact number']
    },
    status: {
        type: String,
        enum: ['open', 'completed', 'cancelled'],
        default: 'open'
    },
    requestor: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    donor: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
