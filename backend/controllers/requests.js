const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');

// @desc    Get all blood requests
// @route   GET /api/requests
// @access  Public
exports.getRequests = async (req, res, next) => {
    try {
        const requests = await BloodRequest.find().sort('-createdAt').populate({
            path: 'requestor',
            select: 'name email phone'
        });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new blood request
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.requestor = req.user.id;

        const request = await BloodRequest.create(req.body);

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update blood request
// @route   PUT /api/requests/:id
// @access  Private
exports.updateRequest = async (req, res, next) => {
    try {
        let request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Make sure user is request owner or admin
        if (request.requestor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to update this request' });
        }

        // Handle Eligibility Tracking if status is completed
        if (req.body.status === 'completed' && req.body.donor) {
            const coolDownDays = 90;
            const nextEligible = new Date();
            nextEligible.setDate(nextEligible.getDate() + coolDownDays);

            await User.findByIdAndUpdate(req.body.donor, {
                lastDonationDate: new Date(),
                nextEligibleDate: nextEligible,
                isAvailable: false // Automatically mark as busy
            });
        }

        request = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: request });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete blood request
// @route   DELETE /api/requests/:id
// @access  Private
exports.deleteRequest = async (req, res, next) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Make sure user is request owner or admin
        if (request.requestor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this request' });
        }

        await request.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
