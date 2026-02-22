const express = require('express');
const { getDonors, getDonor, getDonorStats } = require('../controllers/donors');

const router = express.Router();

router.get('/stats', getDonorStats);
router.get('/', getDonors);
router.get('/:id', getDonor);

module.exports = router;
