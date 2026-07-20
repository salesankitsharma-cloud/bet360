import mongoose from 'mongoose';

const casinoGameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    unique: true,
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    enum: ['slots', 'table', 'live', 'crash', 'dice', 'cards', 'roulette', 'blackjack'],
    required: true
  },
  provider: String,
  category: String,
  description: String,
  image: String,
  thumbnail: String,
  
  // Game Stats
  totalBets: { type: Number, default: 0 },
  totalWinnings: { type: Number, default: 0 },
  totalPlayers: { type: Number, default: 0 },
  rtp: { type: Number, default: 96.5 },
  volatility: String,
  maxPayout: Number,
  minBet: Number,
  maxBet: Number,
  
  // Features
  hasFreespins: Boolean,
  hasBonus: Boolean,
  hasJackpot: Boolean,
  isMobileFriendly: { type: Boolean, default: true },
  isLive: Boolean,
  
  // Configuration
  settings: {
    paylines: Number,
    reels: Number,
    denominations: [Number]
  },
  
  // API Integration
  apiProvider: String,
  apiUrl: String,
  apiKey: String,
  
  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: Number,
  
  // Tags
  tags: [String],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('CasinoGame', casinoGameSchema);
