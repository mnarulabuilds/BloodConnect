const express = require('express');
const { getChats, getChatById, getMessages, startChat, sendMessage } = require('../controllers/chats');
const { protect } = require('../middleware/auth');
const { startChatRules, sendMessageRules, getMessagesRules, getChatByIdRules } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getChats);
router.post('/', startChatRules, startChat);
router.get('/:id', getChatByIdRules, getChatById);
router.get('/:id/messages', getMessagesRules, getMessages);
router.post('/:id/messages', sendMessageRules, sendMessage);

module.exports = router;
