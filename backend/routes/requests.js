const express = require('express');
const { getRequests, createRequest, updateRequest, deleteRequest } = require('../controllers/requests');
const { protect } = require('../middleware/auth');
const { createRequestRules, updateRequestRules, deleteRequestRules } = require('../middleware/validate');

const router = express.Router();

router.get('/', getRequests);
router.post('/', protect, createRequestRules, createRequest);
router.put('/:id', protect, updateRequestRules, updateRequest);
router.delete('/:id', protect, deleteRequestRules, deleteRequest);

module.exports = router;
