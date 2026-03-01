const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, bloodGroup, location, phone, role, latitude, longitude } = req.body;

    const userRole = role?.toLowerCase() === 'hospital' ? 'hospital' : 'donor';

    if (userRole === 'donor' && !bloodGroup) {
      return res.status(400).json({ success: false, error: 'Donors must specify a blood group' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const userData = { name, email, password, location, phone, role: userRole };

    if (latitude && longitude) {
      userData.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    if (userRole === 'donor') {
      userData.bloodGroup = bloodGroup;
    }

    const user = await User.create(userData);
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: 'If an account with that email exists, a reset link has been sent',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    if (env.NODE_ENV !== 'production') {
      logger.info({ resetToken, email: req.body.email }, 'Password reset token generated (dev only)');
    }

    res.status(200).json({
      success: true,
      data: 'If an account with that email exists, a reset link has been sent',
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, data: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== crypto.createHash('sha256').update(refreshToken).digest('hex')) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
    res.status(200).json({ success: true, data: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRE });
  const refreshToken = jwt.sign({ id: user._id, type: 'refresh' }, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRE });

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await User.findByIdAndUpdate(user._id, { refreshToken: refreshTokenHash });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      bloodGroup: user.bloodGroup,
      role: user.role,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
      isAvailable: user.isAvailable,
      lastDonationDate: user.lastDonationDate,
      nextEligibleDate: user.nextEligibleDate,
      isMedicalHistoryClear: user.isMedicalHistoryClear,
      latitude: user.coordinates?.coordinates?.[1] || null,
      longitude: user.coordinates?.coordinates?.[0] || null,
    },
  });
};
