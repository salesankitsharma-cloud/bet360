import crypto from 'crypto';

export const generateReferralCode = () => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const calculateWinRate = (totalBets, wins) => {
  if (totalBets === 0) return 0;
  return ((wins / totalBets) * 100).toFixed(2);
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

export const getOddsFormat = (odds, format = 'decimal') => {
  if (format === 'fractional') {
    // Convert decimal to fractional
    const decimal = parseFloat(odds);
    return `${decimal - 1}:1`;
  }
  return odds;
};

export const calculateBetReturn = (stake, odds) => {
  return stake * odds;
};

export const calculateParlay = (bets) => {
  let totalOdds = 1;
  bets.forEach(bet => {
    totalOdds *= bet.odds;
  });
  return totalOdds;
};

export const getTimeSinceCreation = (createdAt) => {
  const now = new Date();
  const difference = now - new Date(createdAt);
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  return days;
};

export const isEventLive = (startTime, endTime) => {
  const now = new Date();
  return now > new Date(startTime) && now < new Date(endTime);
};
