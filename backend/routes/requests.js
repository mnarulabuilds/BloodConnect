const express = require('express');
const {
    getRequests,
    createRequest,
    updateRequest,
    deleteRequest
} = require('../controllers/requests');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.get('/', getRequests);
router.post('/', protect, createRequest);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);

module.exports = router;
