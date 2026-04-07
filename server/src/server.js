import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/match.js';
import groupRoutes from './routes/groups.js';
import sessionRoutes from './routes/sessions.js';
import inviteRoutes from './routes/invites.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

const app = express();
const server = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: { ...corsOptions, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', messageRoutes);

// Socket.io connection handlers
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-group', (groupId) => {
    socket.join(String(groupId));
    console.log(`✅ User ${socket.id} joined group ${groupId}`);
    // Notify others in the group that someone joined
    socket.to(String(groupId)).emit('user-joined', {
      userId: socket.id,
      message: 'A user joined the group chat'
    });
  });

  socket.on('leave-group', (groupId) => {
    socket.leave(String(groupId));
    console.log(`❌ User ${socket.id} left group ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buddy_to_study';
if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not set in environment, defaulting to ' + mongoUri +
               '\n   Edit server/.env (or set VITE_API_URL) to point at your database.');
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
