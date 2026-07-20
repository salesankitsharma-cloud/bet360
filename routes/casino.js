import express from 'express';
import CasinoGame from '../models/CasinoGame.js';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get All Casino Games
router.get('/games', async (req, res) => {
  try {
    const { gameType, search, limit = 20, skip = 0 } = req.query;
    const query = { isActive: true };
    
    if (gameType) query.gameType = gameType;
    if (search) query.gameName = { $regex: search, $options: 'i' };

    const games = await CasinoGame.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await CasinoGame.countDocuments(query);

    res.json({ games, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Game Details
router.get('/game/:gameId', async (req, res) => {
  try {
    const game = await CasinoGame.findOne({ gameId: req.params.gameId });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start Game Session
router.post('/start-game/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.userId;
    const { betAmount } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const game = await CasinoGame.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Call Casino API
    try {
      const response = await axios.post(
        `${game.apiUrl}/start-session`,
        {
          gameId,
          userId,
          betAmount,
          currency: user.currency
        },
        {
          headers: {
            'Authorization': `Bearer ${game.apiKey}`
          }
        }
      );

      const sessionId = response.data.sessionId;

      // Deduct bet from balance
      user.balance -= betAmount;
      await user.save();

      res.json({
        message: 'Game session started',
        sessionId,
        gameUrl: response.data.gameUrl,
        betAmount
      });
    } catch (apiError) {
      return res.status(500).json({ message: 'Failed to start game session' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Finish Game
router.post('/finish-game', authenticateToken, async (req, res) => {
  try {
    const { sessionId, gameId, result, winAmount, betAmount } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create bet record
    const bet = new Bet({
      betId: uuidv4(),
      userId,
      gameId,
      gameType: 'casino',
      betStatus: result ? 'won' : 'lost',
      stakeAmount: betAmount,
      actualWinnings: winAmount,
      multiplier: result ? (winAmount / betAmount) : 0
    });
    await bet.save();

    // Update user balance
    if (result) {
      user.balance += winAmount;
      user.totalWinnings += winAmount;
    } else {
      user.totalLosses += betAmount;
    }
    
    user.totalBets += 1;
    await user.save();

    // Create transaction
    const transaction = new Transaction({
      transactionId: uuidv4(),
      userId,
      type: result ? 'win' : 'bet',
      amount: result ? winAmount : -betAmount,
      status: 'completed',
      betId: bet._id
    });
    await transaction.save();

    res.json({
      message: 'Game finished',
      result,
      winAmount,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Crash Game - Real-time
router.post('/crash-game', authenticateToken, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Generate crash point (1.0x to 100x)
    const crashPoint = (Math.random() * 99 + 1).toFixed(2);
    const gameId = uuidv4();

    user.balance -= betAmount;
    await user.save();

    res.json({
      gameId,
      crashPoint,
      betAmount,
      message: 'Crash game started, wait for result'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User's Game History
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const bets = await Bet.find({ 
      userId: req.user.userId,
      gameType: 'casino'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    const total = await Bet.countDocuments({
      userId: req.user.userId,
      gameType: 'casino'
    });

    res.json({ bets, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
