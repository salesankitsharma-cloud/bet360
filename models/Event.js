import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true
  },
  sport: {
    type: String,
    enum: ['football', 'basketball', 'tennis', 'hockey', 'baseball', 'cricket', 'rugby'],
    required: true
  },
  league: String,
  tournament: String,
  
  // Teams/Players
  homeTeam: String,
  awayTeam: String,
  homeTeamId: String,
  awayTeamId: String,
  
  // Event Details
  eventStatus: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: Date,
  endTime: Date,
  
  // Venue
  venue: String,
  city: String,
  country: String,
  
  // Markets & Odds
  markets: [{
    marketId: String,
    marketName: String,
    selections: [{
      selectionId: String,
      selectionName: String,
      odds: Number,
      status: String
    }]
  }],
  
  // Results
  homeTeamScore: Number,
  awayTeamScore: Number,
  result: { type: String, enum: ['home', 'away', 'draw', 'void'] },
  resultConfirmed: { type: Boolean, default: false },
  confirmedAt: Date,
  
  // Live Data
  liveData: {
    currentTime: Number,
    possession: { home: Number, away: Number },
    shots: { home: Number, away: Number },
    corners: { home: Number, away: Number },
    cards: { home: Number, away: Number }
  },
  
  // Odds Movement
  oddsHistory: [{
    timestamp: Date,
    odds: Object
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
