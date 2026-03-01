const User = require('../models/User');
const logger = require('../config/logger');

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'email', 'phone', 'location', 'avatar', 'isAvailable',
      'lastDonationDate', 'nextEligibleDate', 'isMedicalHistoryClear', 'role', 'bloodGroup',
    ];

    const fieldsToUpdate = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    }

    if (req.body.latitude && req.body.longitude) {
      const lat = parseFloat(req.body.latitude);
      const lng = parseFloat(req.body.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        fieldsToUpdate.coordinates = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
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
  } catch (err) {
    next(err);
  }
};
