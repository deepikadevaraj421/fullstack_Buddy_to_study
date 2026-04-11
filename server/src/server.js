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
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.netlify.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// MongoDB lazy connection (required for Vercel cold starts)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buddy_to_study';
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(mongoUri);
  isConnected = true;
  console.log('✅ Connected to MongoDB:', mongoUri.split('@')[1] || mongoUri);
};

app.use(cors(corsOptions));
app.use(express.json());

// On Vercel, ensure DB is connected before every request
if (isProduction) {
  app.use(async (req, res, next) => {
    try { await connectDB(); next(); }
    catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Local dev: Socket.io + server.listen
const server = createServer(app);
const io = new Server(server, {
  cors: { ...corsOptions, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});
io.on('connection', (socket) => {
  socket.on('join-group', (groupId) => socket.join(String(groupId)));
  socket.on('leave-group', (groupId) => socket.leave(String(groupId)));
});
app.set('io', io);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)))
  .catch(err => { console.error('❌ MongoDB connection error:', err); process.exit(1); });

export default app;
