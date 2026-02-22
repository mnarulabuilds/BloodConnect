const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    bloodRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
