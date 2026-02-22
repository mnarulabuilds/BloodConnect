const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
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

    socket.on('send_message', (data) => {
        // Broadcast to all users in the chat room
        io.to(data.chatId).emit('receive_message', data);
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

