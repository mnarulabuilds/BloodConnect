const User = require('../models/User');

// @desc    Get all donors
// @route   GET /api/donors
// @access  Public
exports.getDonors = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        const filter = JSON.parse(queryStr);

        // Geospatial filter
        if (req.query.latitude && req.query.longitude) {
            const lat = parseFloat(req.query.latitude);
            const lng = parseFloat(req.query.longitude);
            const radius = parseFloat(req.query.radius) || 10; // Default 10km

            filter.coordinates = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: radius * 1000 // Convert km to meters
                }
            };

            // Remove lat/lng/radius from filter so they don't interfere with field matching
            delete filter.latitude;
            delete filter.longitude;
            delete filter.radius;
        }

        filter.role = 'donor';
        filter.isAvailable = true;

        query = User.find(filter);

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Executing query
        const donors = await query;

        res.status(200).json({
            success: true,
            count: donors.length,
            data: donors
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single donor
// @route   GET /api/donors/:id
// @access  Public
exports.getDonor = async (req, res, next) => {
    try {
        const donor = await User.findById(req.params.id);

        if (!donor || donor.role !== 'donor') {
            return res.status(404).json({ success: false, error: 'Donor not found' });
        }

        res.status(200).json({ success: true, data: donor });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
