const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGIN,
        methods: ['GET', 'POST']
    }
});

// Rate limiter: max 20 auth requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chats', require('./routes/chats'));

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`💬 User joined chat: ${chatId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // Persist message to DB so history is never lost
            const message = await Message.create({
                chatId: data.chatId,
                senderId: data.senderId,
                text: data.text
            });

            // Update the chat's lastMessage pointer
            await Chat.findByIdAndUpdate(data.chatId, { lastMessage: message._id });

            // Broadcast the persisted message (with _id & timestamps) to the room
            io.to(data.chatId).emit('receive_message', message);
        } catch (err) {
            console.error('❌ Failed to persist socket message:', err.message);
            // Still broadcast so the sender doesn't get stuck, but flag the error
            socket.emit('message_error', { error: 'Message could not be saved.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('👤 User disconnected');
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to BloodConnect API' });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

