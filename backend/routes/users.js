const express = require('express');
const { updateProfile } = require('../controllers/users');
const { protect } = require('../middleware/auth');
const { updateProfileRules } = require('../middleware/validate');

const router = express.Router();

router.put('/profile', protect, updateProfileRules, updateProfile);

module.exports = router;
