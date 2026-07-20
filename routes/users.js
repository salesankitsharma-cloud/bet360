import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, country, city, address, zipCode, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, phone, country, city, address, zipCode, avatar },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    const stats = {
      totalBets: user.totalBets,
      totalWinnings: user.totalWinnings,
      totalLosses: user.totalLosses,
      winRate: user.winRate,
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const leaderboard = await User.find({ role: 'user' })
      .select('username totalWinnings avatar')
      .sort({ totalWinnings: -1 })
      .limit(parseInt(limit));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Referral Program
router.get('/referral-info', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    const referrals = await User.find({ referredBy: user._id }).select('username createdAt');

    res.json({
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      referrals: referrals.length,
      referralsList: referrals
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enable 2FA
router.post('/enable-2fa', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { twoFactorEnabled: true },
      { new: true }
    );

    res.json({ message: '2FA enabled', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Self Exclusion
router.post('/self-exclude', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { selfExcluded: true, status: 'suspended' },
      { new: true }
    );

    res.json({ message: 'Account suspended', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
