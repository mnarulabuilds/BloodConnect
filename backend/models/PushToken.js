const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

pushTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('PushToken', pushTokenSchema);
