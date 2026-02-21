const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            location: req.body.location,
            avatar: req.body.avatar // This will be the base64 string or URL
        };

        // Remove undefined fields
        Object.keys(fieldsToUpdate).forEach(
            key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
        );

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

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
                avatar: user.avatar
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
