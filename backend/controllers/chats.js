const Chat = require('../models/Chat');
const Message = require('../models/Message');

// @desc    Get user chats
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: { $in: [req.user.id] }
        })
            .populate('participants', 'name bloodGroup avatar role')
            .populate('lastMessage')
            .sort('-updatedAt');

        // Mask names for donor privacy if needed
        const processedChats = chats.map(chat => {
            const otherParticipant = chat.participants.find(p => p._id.toString() !== req.user.id);

            // If the other participant is a donor, we might want to mask their name
            // For now, let's just send the data and handle UI masking or implement a 'mask' logic here.
            return chat;
        });

        res.status(200).json({ success: true, data: processedChats });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get chat messages
// @route   GET /api/chats/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        // Security: verify caller is a participant of this chat
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }
        const isParticipant = chat.participants.some(p => p.toString() === req.user.id);
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this chat' });
        }

        const messages = await Message.find({ chatId: req.params.id })
            .sort('createdAt');

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Start/Get chat
// @route   POST /api/chats
// @access  Private
exports.startChat = async (req, res) => {
    const { recipientId, bloodRequestId } = req.body;

    try {
        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, recipientId] },
            bloodRequestId: bloodRequestId || { $exists: false }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [req.user.id, recipientId],
                bloodRequestId
            });
        }

        res.status(200).json({ success: true, data: chat });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Send message
// @route   POST /api/chats/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        // Security: verify caller is a participant of this chat
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }
        const isParticipant = chat.participants.some(p => p.toString() === req.user.id);
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: 'Not authorized to send messages in this chat' });
        }

        const message = await Message.create({
            chatId: req.params.id,
            senderId: req.user.id,
            text: req.body.text
        });

        await Chat.findByIdAndUpdate(req.params.id, {
            lastMessage: message._id
        });

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
