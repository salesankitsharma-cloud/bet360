import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Get Wallet Balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      balance: user.balance,
      bonusBalance: user.bonusBalance,
      currency: user.currency,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deposit - Stripe Payment
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.userId);

    if (amount < 10) {
      return res.status(400).json({ message: 'Minimum deposit is $10' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: user.currency.toLowerCase(),
      metadata: {
        userId: user._id.toString(),
        username: user.username
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: user.currency
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment processing error' });
  }
});

// Confirm Deposit
router.post('/confirm-deposit', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const user = await User.findById(req.user.userId);

    // Verify with Stripe
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Update user balance
    user.balance += amount;
    user.totalDeposited += amount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      transactionId: uuidv4(),
      userId: user._id,
      type: 'deposit',
      amount,
      status: 'completed',
      paymentMethod: 'stripe',
      gatewayReference: paymentIntentId
    });
    await transaction.save();

    res.json({
      message: 'Deposit successful',
      newBalance: user.balance,
      amount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdraw Request
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;
    const user = await User.findById(req.user.userId);

    if (amount < 20) {
      return res.status(400).json({ message: 'Minimum withdrawal is $20' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (user.kyc.status !== 'verified') {
      return res.status(400).json({ message: 'KYC verification required' });
    }

    // Create withdrawal request
    const transaction = new Transaction({
      transactionId: uuidv4(),
      userId: user._id,
      type: 'withdrawal',
      amount,
      status: 'pending'
    });
    await transaction.save();

    user.balance -= amount;
    await user.save();

    res.json({
      message: 'Withdrawal request submitted',
      withdrawalId: transaction.transactionId,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Transaction History
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 20, skip = 0 } = req.query;
    const query = { userId: req.user.userId };
    
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
