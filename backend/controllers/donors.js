const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const logger = require('../config/logger');

const ALLOWED_SELECT_FIELDS = ['name', 'bloodGroup', 'location', 'phone', 'isAvailable', 'coordinates', 'avatar', 'role', 'createdAt'];
const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'bloodGroup', 'location'];

exports.getDonors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      role: 'donor',
      isAvailable: true,
      nextEligibleDate: { $lte: new Date() },
      isMedicalHistoryClear: true,
    };

    if (req.query.bloodGroup) {
      const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (validGroups.includes(req.query.bloodGroup)) {
        filter.bloodGroup = req.query.bloodGroup;
      }
    }

    if (req.query.latitude && req.query.longitude) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const radius = parseFloat(req.query.radius) || 10;

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        filter.coordinates = {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius * 1000,
          },
        };
      }
    }

    let query = User.find(filter);

    if (req.query.select) {
      const requestedFields = req.query.select.split(',');
      const safeFields = requestedFields.filter((f) => ALLOWED_SELECT_FIELDS.includes(f.trim()));
      if (safeFields.length > 0) {
        query = query.select(safeFields.join(' '));
      }
    }

    if (req.query.sort) {
      const requestedSorts = req.query.sort.split(',');
      const safeSorts = requestedSorts.filter((s) => {
        const field = s.replace(/^-/, '').trim();
        return ALLOWED_SORT_FIELDS.includes(field);
      });
      if (safeSorts.length > 0) {
        query = query.sort(safeSorts.join(' '));
      } else {
        query = query.sort('-createdAt');
      }
    } else {
      query = query.sort('-createdAt');
    }

    const [donors, totalCount] = await Promise.all([
      query.skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      count: donors.length,
      data: donors,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDonor = async (req, res, next) => {
  try {
    const donor = await User.findById(req.params.id);

    if (!donor || donor.role !== 'donor') {
      return res.status(404).json({ success: false, error: 'Donor not found' });
    }

    res.status(200).json({ success: true, data: donor });
  } catch (err) {
    next(err);
  }
};

exports.getDonorStats = async (req, res, next) => {
  try {
    const eligibilityFilter = {
      role: 'donor',
      isAvailable: true,
      nextEligibleDate: { $lte: new Date() },
      isMedicalHistoryClear: true,
    };

    const [donorCount, savedCount, groupStats] = await Promise.all([
      User.countDocuments(eligibilityFilter),
      BloodRequest.countDocuments({ status: 'completed' }),
      User.aggregate([
        { $match: eligibilityFilter },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      totalDonors: donorCount,
      totalSaved: savedCount,
      groupStats: groupStats.map((g) => ({ group: g._id, count: g.count })),
    });
  } catch (err) {
    next(err);
  }
};
