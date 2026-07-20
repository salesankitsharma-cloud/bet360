import express from 'express';
import Bet from '../models/Bet.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Place Bet
router.post('/place-bet', authenticateToken, async (req, res) => {
  try {
    const { selections, stakeAmount, betType } = req.body;
    const userId = req.user.userId;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check balance
    if (user.balance < stakeAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Calculate odds
    let totalOdds = 1;
    selections.forEach(sel => {
      totalOdds *= sel.odds;
    });

    const potentialWinnings = stakeAmount * totalOdds;

    // Create bet
    const bet = new Bet({
      betId: uuidv4(),
      userId,
      betType,
      selections,
      stakeAmount,
      potentialWinnings,
      totalOdds
    });

    await bet.save();

    // Deduct from balance
    user.balance -= stakeAmount;
    user.totalBets += 1;
    await user.save();

    // Create transaction
    const transaction = new Transaction({
      transactionId: uuidv4(),
      userId,
      type: 'bet',
      amount: stakeAmount,
      status: 'completed',
      betId: bet._id
    });
    await transaction.save();

    res.json({
      message: 'Bet placed successfully',
      bet: {
        betId: bet.betId,
        stakeAmount,
        potentialWinnings,
        selections
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User Bets
router.get('/my-bets', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 10, skip = 0 } = req.query;
    const query = { userId: req.user.userId };
    
    if (status) query.betStatus = status;

    const bets = await Bet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Bet.countDocuments(query);

    res.json({ bets, total, limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Bet Details
router.get('/bet/:betId', authenticateToken, async (req, res) => {
  try {
    const bet = await Bet.findOne({ 
      betId: req.params.betId,
      userId: req.user.userId
    });

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    res.json(bet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel Bet
router.post('/cancel-bet/:betId', authenticateToken, async (req, res) => {
  try {
    const bet = await Bet.findOne({
      betId: req.params.betId,
      userId: req.user.userId
    });

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    if (bet.betStatus !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel this bet' });
    }

    // Refund bet
    const user = await User.findById(req.user.userId);
    user.balance += bet.stakeAmount;
    await user.save();

    bet.betStatus = 'cancelled';
    await bet.save();

    res.json({ message: 'Bet cancelled successfully', refund: bet.stakeAmount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Available Events
router.get('/events', async (req, res) => {
  try {
    const { sport, status = 'scheduled', limit = 20 } = req.query;
    const query = { eventStatus: status };
    
    if (sport) query.sport = sport;

    const events = await Event.find(query)
      .sort({ startTime: 1 })
      .limit(parseInt(limit));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Event Details
router.get('/event/:eventId', async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Settle Bet (Admin Only)
router.post('/settle-bet/:betId', authenticateToken, async (req, res) => {
  try {
    const { result } = req.body;
    const bet = await Bet.findOne({ betId: req.params.betId });

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    const user = await User.findById(bet.userId);

    if (result === 'won') {
      bet.betStatus = 'won';
      bet.actualWinnings = bet.potentialWinnings;
      user.balance += bet.potentialWinnings;
      user.totalWinnings += bet.potentialWinnings;
    } else {
      bet.betStatus = 'lost';
      user.totalLosses += bet.stakeAmount;
    }

    bet.settledAt = new Date();
    await bet.save();
    await user.save();

    res.json({ message: 'Bet settled', bet });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
