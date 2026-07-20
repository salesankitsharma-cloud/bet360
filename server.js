import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import authRoutes from './routes/auth.js';
import bettingRoutes from './routes/betting.js';
import casinoRoutes from './routes/casino.js';
import usersRoutes from './routes/users.js';
import walletRoutes from './routes/wallet.js';
import sportsRoutes from './routes/sports.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/betting', bettingRoutes);
app.use('/api/casino', casinoRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-game', (data) => {
    socket.join(`game-${data.gameId}`);
    io.to(`game-${data.gameId}`).emit('player-joined', { userId: data.userId });
  });

  socket.on('place-bet', (data) => {
    io.to(`game-${data.gameId}`).emit('bet-placed', data);
  });

  socket.on('game-result', (data) => {
    io.to(`game-${data.gameId}`).emit('result', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
