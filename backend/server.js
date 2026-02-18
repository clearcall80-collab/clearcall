const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const contactRoutes = require('./routes/contacts');
const callHistoryRoutes = require('./routes/callHistory');
const messageRoutes = require('./routes/messages');
const welcomeRoutes = require('./routes/welcome');

// Import socket handlers
const socketHandlers = require('./socket/socketHandlers');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:5173", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

const corsOptions = {
  origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:5173", "http://localhost:3001", "http://localhost:3002"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());
require('./config/passport')(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/call-history', callHistoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', welcomeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io connection
socketHandlers(io);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server, io };
