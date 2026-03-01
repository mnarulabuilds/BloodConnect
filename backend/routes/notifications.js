const express = require('express');
const { registerToken, unregisterToken } = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register-token', protect, registerToken);
router.delete('/unregister-token', protect, unregisterToken);

module.exports = router;
