const PushToken = require('../models/PushToken');
const logger = require('../config/logger');

exports.registerToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ success: false, error: 'Token and platform are required' });
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({ success: false, error: 'Invalid platform' });
    }

    await PushToken.findOneAndUpdate(
      { token },
      { userId: req.user.id, token, platform },
      { upsert: true, new: true }
    );

    logger.info({ userId: req.user.id, platform }, 'Push token registered');
    res.status(200).json({ success: true, data: 'Token registered' });
  } catch (err) {
    next(err);
  }
};

exports.unregisterToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    await PushToken.findOneAndDelete({ token, userId: req.user.id });

    logger.info({ userId: req.user.id }, 'Push token unregistered');
    res.status(200).json({ success: true, data: 'Token unregistered' });
  } catch (err) {
    next(err);
  }
};
