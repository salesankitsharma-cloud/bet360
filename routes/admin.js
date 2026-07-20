import express from 'express';
import User from '../models/User.js';
import Bet from '../models/Bet.js';
import Event from '../models/Event.js';
import CasinoGame from '../models/CasinoGame.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken, adminAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get Dashboard Statistics
router.get('/dashboard', authenticateToken, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBets = await Bet.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const totalRevenue = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const activeBets = await Bet.countDocuments({ betStatus: 'pending' });
    const wonBets = await Bet.countDocuments({ betStatus: 'won' });
    const lostBets = await Bet.countDocuments({ betStatus: 'lost' });

    res.json({
      totalUsers,
      totalBets,
      totalTransactions,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeBets,
      wonBets,
      lostBets
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Users - List
router.get('/users', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;
    const query = {};
    
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(query);

    res.json({ users, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend User
router.post('/users/:userId/suspend', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'suspended' },
      { new: true }
    );

    res.json({ message: 'User suspended', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban User
router.post('/users/:userId/ban', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'banned' },
      { new: true }
    );

    res.json({ message: 'User banned', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Bets
router.get('/bets', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;
    const query = {};
    
    if (status) query.betStatus = status;

    const bets = await Bet.find(query)
      .populate('userId', 'username email')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Bet.countDocuments(query);

    res.json({ bets, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel Bet (Admin)
router.post('/bets/:betId/cancel', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const bet = await Bet.findOne({ betId: req.params.betId });

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    const user = await User.findById(bet.userId);
    user.balance += bet.stakeAmount;
    await user.save();

    bet.betStatus = 'cancelled';
    bet.cancellationReason = reason;
    await bet.save();

    res.json({ message: 'Bet cancelled', bet });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Transactions
router.get('/transactions', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { type, status, limit = 20, skip = 0 } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject Withdrawal
router.post('/transactions/:transactionId/approve', authenticateToken, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction || transaction.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    transaction.status = 'completed';
    transaction.verifiedBy = req.user.userId;
    await transaction.save();

    res.json({ message: 'Withdrawal approved', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Casino Game
router.post('/casino-games', authenticateToken, adminAuth, async (req, res) => {
  try {
    const gameData = req.body;
    
    const game = new CasinoGame({
      gameId: uuidv4(),
      ...gameData
    });

    await game.save();
    res.json({ message: 'Game added', game });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Casino Game
router.put('/casino-games/:gameId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const game = await CasinoGame.findOneAndUpdate(
      { gameId: req.params.gameId },
      req.body,
      { new: true }
    );

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ message: 'Game updated', game });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Sports Event
router.post('/events', authenticateToken, adminAuth, async (req, res) => {
  try {
    const eventData = req.body;
    
    const event = new Event({
      eventId: uuidv4(),
      ...eventData
    });

    await event.save();
    res.json({ message: 'Event added', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Event
router.put('/events/:eventId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { eventId: req.params.eventId },
      req.body,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event updated', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get System Logs
router.get('/logs', authenticateToken, adminAuth, async (req, res) => {
  try {
    // Implement logging system
    res.json({ message: 'Logs endpoint' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
