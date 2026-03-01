const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);

if (env.NODE_ENV !== 'development' && env.CORS_ORIGIN === '*') {
  logger.warn('CORS_ORIGIN is set to "*" in non-development environment. Set it to your frontend origin.');
}

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// --- Socket.io JWT Authentication ---
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

// --- Rate Limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use(globalLimiter);
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// --- Routes ---
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/notifications', require('./routes/notifications'));

// --- Health Check ---
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    db: dbStatus[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BloodConnect API' });
});

// --- Socket.io Logic ---
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

// --- Error Handler (must be last middleware) ---
app.use(errorHandler);

// --- Database Connection & Server Start ---
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

// --- Graceful Shutdown ---
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
