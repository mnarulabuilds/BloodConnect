const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, bloodGroup, location, phone, role, latitude, longitude } = req.body;

        // Basic validation
        if (!name || !email || !password || !location || !phone) {
            return res.status(400).json({ success: false, error: 'Please fill in all required fields' });
        }

        const userRole = role?.toLowerCase() === 'hospital' ? 'hospital' : 'donor';

        // Donors must have a blood group
        if (userRole === 'donor' && !bloodGroup) {
            return res.status(400).json({ success: false, error: 'Donors must specify a blood group' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'An account with this email already exists' });
        }

        // Create user object
        const userData = {
            name,
            email,
            password,
            location,
            phone,
            role: userRole
        };

        // Add coordinates if provided
        if (latitude && longitude) {
            userData.coordinates = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        // Only add bloodGroup if it's a donor
        if (userRole === 'donor') {
            userData.bloodGroup = bloodGroup;
        }

        const user = await User.create(userData);

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Get token from model, create cookie and send response
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ error: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // In a real app, you would send an email here.
    // For this demo/setup, we return the token in the response
    res.status(200).json({
        success: true,
        data: 'Password reset token generated',
        token: resetToken // Returning token for demo purposes
    });
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
    const crypto = require('crypto');
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful'
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            bloodGroup: user.bloodGroup,
            role: user.role,
            phone: user.phone,
            location: user.location,
            avatar: user.avatar,
            isAvailable: user.isAvailable
        }
    });
};
