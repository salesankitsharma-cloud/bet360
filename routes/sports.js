import express from 'express';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// Get All Sports
router.get('/sports', async (req, res) => {
  try {
    const sports = ['football', 'basketball', 'tennis', 'hockey', 'baseball', 'cricket', 'rugby'];
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Events by Sport
router.get('/events/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { status = 'scheduled', limit = 50 } = req.query;

    const events = await Event.find({ 
      sport, 
      eventStatus: status 
    })
    .sort({ startTime: 1 })
    .limit(parseInt(limit));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Live Events
router.get('/live-events', async (req, res) => {
  try {
    const events = await Event.find({ eventStatus: 'live' })
      .sort({ startTime: -1 });

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

// Search Events
router.get('/search', async (req, res) => {
  try {
    const { q, sport, limit = 20 } = req.query;
    
    const query = {
      $or: [
        { homeTeam: { $regex: q, $options: 'i' } },
        { awayTeam: { $regex: q, $options: 'i' } },
        { tournament: { $regex: q, $options: 'i' } }
      ]
    };

    if (sport) query.sport = sport;

    const events = await Event.find(query)
      .limit(parseInt(limit));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Upcoming Events
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7, limit = 50 } = req.query;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const events = await Event.find({
      eventStatus: 'scheduled',
      startTime: { $gte: startDate, $lte: endDate }
    })
    .sort({ startTime: 1 })
    .limit(parseInt(limit));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Event Markets and Odds
router.get('/event/:eventId/markets', async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event.markets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
