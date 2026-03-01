const mongoose = require('mongoose');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const logger = require('../config/logger');
const { notifyMatchingDonors } = require('../utils/pushNotifications');

exports.getRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.status) filter.status = req.query.status;

    const [requests, totalCount] = await Promise.all([
      BloodRequest.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate({ path: 'requestor', select: 'name phone' }),
      BloodRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const { patientName, bloodGroup, hospital, location, units, urgency, contact } = req.body;

    const request = await BloodRequest.create({
      patientName,
      bloodGroup,
      hospital,
      location,
      units,
      urgency,
      contact,
      requestor: req.user.id,
    });

    res.status(201).json({ success: true, data: request });

    notifyMatchingDonors(request, req.user.id).catch((err) =>
      logger.error({ err }, 'Background donor notification failed')
    );
  } catch (err) {
    next(err);
  }
};

exports.updateRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let request = await BloodRequest.findById(req.params.id).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.requestor.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({ success: false, error: 'Not authorized to update this request' });
    }

    if (req.body.status === 'completed' && req.body.donor) {
      const coolDownDays = 90;
      const nextEligible = new Date();
      nextEligible.setDate(nextEligible.getDate() + coolDownDays);

      await User.findByIdAndUpdate(
        req.body.donor,
        { lastDonationDate: new Date(), nextEligibleDate: nextEligible, isAvailable: false },
        { session }
      );
    }

    const allowedUpdates = ['status', 'units', 'urgency', 'hospital', 'location', 'contact', 'patientName', 'donor'];
    const updateData = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    request = await BloodRequest.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      session,
    });

    await session.commitTransaction();
    res.status(200).json({ success: true, data: request });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.requestor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this request' });
    }

    await request.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
