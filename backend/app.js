const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');

const createApp = () => {
  const app = express();

  if (env.NODE_ENV !== 'development' && env.CORS_ORIGIN === '*') {
    logger.warn('CORS_ORIGIN is set to "*" in non-development environment. Set it to your frontend origin.');
  }

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

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());
  app.use(globalLimiter);
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.use('/api/auth', authLimiter, require('./routes/auth'));
  app.use('/api/donors', require('./routes/donors'));
  app.use('/api/requests', require('./routes/requests'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/chats', require('./routes/chats'));
  app.use('/api/notifications', require('./routes/notifications'));

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

  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
