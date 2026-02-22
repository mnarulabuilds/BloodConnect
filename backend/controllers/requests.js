const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');

// @desc    Get all blood requests (paginated + filtered)
// @route   GET /api/requests?page=1&limit=10&bloodGroup=A%2B&urgency=Urgent&status=open
// @access  Public
exports.getRequests = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        // Build optional filter
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
            BloodRequest.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
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
        // Explicitly whitelist allowed fields to prevent mass-assignment
        const { patientName, bloodGroup, hospital, location, units, urgency, contact } = req.body;

        const request = await BloodRequest.create({
            patientName,
            bloodGroup,
            hospital,
            location,
            units,
            urgency,
            contact,
            requestor: req.user.id  // Always taken from authenticated token, never from body
        });

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
