const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'https://matrimony-madurai.web.app', 'https://matrimony-madurai.firebaseapp.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

// Attach socket.io to app to use in controllers
app.set("socketio", io);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.json());

// Track online users
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('New Socket.IO connection:', socket.id);

    // Initial setup: User connects and tells us their ID
    socket.on('setup', (userData) => {
        if (!userData || !userData._id) return;
        socket.join(userData._id);
        onlineUsers.set(userData._id, socket.id);
        console.log(`User ${userData._id} is online`);
        io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // Handle joining a specific chat room
    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User Joined Room: ' + room);
    });

    // Handle real-time messaging
    socket.on('new message', (newMessageReceived) => {
        const chat = newMessageReceived.chat || newMessageReceived.receiver; // Depending on how frontend sends it
        if (!chat) return console.log('Chat/Receiver not defined');

        // Emit to the receiver's private room
        socket.in(chat).emit('message received', newMessageReceived);
    });

    socket.on('disconnect', () => {
        let disconnectedUserId = null;
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }
        if (disconnectedUserId) {
            onlineUsers.delete(disconnectedUserId);
            console.log(`User ${disconnectedUserId} disconnected`);
            io.emit('online-users', Array.from(onlineUsers.keys()));
        }
    });

    socket.off('setup', () => {
        console.log('USER DISCONNECTED');
        socket.leave(userData._id);
    });
});

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Enable CORS
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://localhost:5174', 
        'https://matrimony-madurai.web.app', 
        'https://matrimony-madurai.firebaseapp.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Mount routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Basic Route - API Wellness Page
app.get('/', (req, res) => {
    res.render('index', {
        dbHost: mongoose.connection.host || 'Establishing Connection...',
        paymentStatus: process.env.RAZORPAY_KEY_ID ? '✅ Connected and Initialized (Live Mode)' : '⚠️ Payment Keys Missing',
        serverMode: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000
    });
});

// Port configuration
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    
    // Razorpay Connection Confirmation
    if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('YourKeyHere')) {
        console.log('Razorpay API: ✅ Connected and Initialized (Live Mode)');
    } else {
        console.log('Razorpay API: ⚠️  Using Placeholders (Action Required: Update .env keys)');
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
});
