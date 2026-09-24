const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const logger = require('./config/logger');
const { createApp } = require('./app');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    return next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, userId: socket.userId }, 'User connected');

  socket.on('join_chat', async (chatId) => {
    try {
      if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        return socket.emit('error', { error: 'Invalid chat ID' });
      }
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.some((p) => p.toString() === socket.userId)) {
        return socket.emit('error', { error: 'Not authorized to join this chat' });
      }
      socket.join(chatId);
      logger.debug({ userId: socket.userId, chatId }, 'User joined chat');
    } catch (err) {
      logger.error({ err, chatId }, 'Error joining chat');
      socket.emit('error', { error: 'Failed to join chat' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      if (!data.chatId || !mongoose.Types.ObjectId.isValid(data.chatId)) {
        return socket.emit('message_error', { error: 'Invalid chat ID' });
      }
      const text = (data.text || '').trim();
      if (!text || text.length > 2000) {
        return socket.emit('message_error', { error: 'Message must be 1-2000 characters' });
      }

      const chat = await Chat.findById(data.chatId);
      if (!chat || !chat.participants.some((p) => p.toString() === socket.userId)) {
        return socket.emit('message_error', { error: 'Not authorized' });
      }

      const message = await Message.create({
        chatId: data.chatId,
        senderId: socket.userId,
        text,
      });

      await Chat.findByIdAndUpdate(data.chatId, { lastMessage: message._id });
      io.to(data.chatId).emit('receive_message', message);
    } catch (err) {
      logger.error({ err }, 'Failed to persist socket message');
      socket.emit('message_error', { error: 'Message could not be saved.' });
    }
  });

  socket.on('disconnect', () => {
    logger.debug({ socketId: socket.id, userId: socket.userId }, 'User disconnected');
  });
});

mongoose
  .connect(env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    server.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server running');
    });
  })
  .catch((err) => {
    logger.fatal({ err }, 'MongoDB connection failed');
    process.exit(1);
  });

const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutdown signal received, closing gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  io.close(() => {
    logger.info('Socket.io server closed');
  });
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing MongoDB connection');
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server, io };
