const express = require('express');
const {
    getChats,
    getMessages,
    startChat,
    sendMessage
} = require('../controllers/chats');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getChats);
router.post('/', startChat);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
