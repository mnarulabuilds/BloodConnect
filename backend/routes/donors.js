const express = require('express');
const { getDonors, getDonor } = require('../controllers/donors');

const router = express.Router();

router.get('/', getDonors);
router.get('/:id', getDonor);

module.exports = router;
