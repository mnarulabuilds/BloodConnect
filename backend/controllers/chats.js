const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const logger = require('../config/logger');

exports.getChats = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { participants: { $in: [req.user.id] } };

    const [chats, totalCount] = await Promise.all([
      Chat.find(filter)
        .populate('participants', 'name bloodGroup avatar role')
        .populate('lastMessage')
        .sort('-updatedAt')
        .skip(skip)
        .limit(limit),
      Chat.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      count: chats.length,
      data: chats,
    });
  } catch (err) {
    next(err);
  }
};

exports.getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name bloodGroup avatar role')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const isParticipant = chat.participants.some((p) => p._id.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this chat' });
    }

    res.status(200).json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const isParticipant = chat.participants.some((p) => p.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this chat' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [messages, totalCount] = await Promise.all([
      Message.find({ chatId: req.params.id }).sort('createdAt').skip(skip).limit(limit),
      Message.countDocuments({ chatId: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
};

exports.startChat = async (req, res, next) => {
  const { recipientId, bloodRequestId } = req.body;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, recipientId] },
      bloodRequestId: bloodRequestId || { $exists: false },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.id, recipientId],
        bloodRequestId,
      });
    }

    res.status(200).json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const chat = await Chat.findById(req.params.id).session(session);
    if (!chat) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const isParticipant = chat.participants.some((p) => p.toString() === req.user.id);
    if (!isParticipant) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, error: 'Not authorized to send messages in this chat' });
    }

    const [message] = await Message.create(
      [{ chatId: req.params.id, senderId: req.user.id, text: req.body.text }],
      { session }
    );

    await Chat.findByIdAndUpdate(req.params.id, { lastMessage: message._id }, { session });

    await session.commitTransaction();
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
