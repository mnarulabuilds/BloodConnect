const express = require('express');
const { register, login, forgotPassword, resetPassword, refreshToken, logoutUser } = require('../controllers/auth');
const { registerRules, loginRules, forgotPasswordRules, resetPasswordRules } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/forgotpassword', forgotPasswordRules, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordRules, resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logoutUser);

module.exports = router;
