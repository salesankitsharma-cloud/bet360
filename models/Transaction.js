import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Transaction Type
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'bet', 'win', 'refund', 'bonus', 'transfer'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  currency: { type: String, default: 'USD' },
  
  // Payment Method
  paymentMethod: String,
  paymentGateway: String,
  gatewayReference: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Related Records
  betId: mongoose.Schema.Types.ObjectId,
  depositId: String,
  withdrawalId: String,
  
  // Details
  description: String,
  notes: String,
  
  // Fee
  fee: { type: Number, default: 0 },
  netAmount: Number,
  
  // Timing
  requestedAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Verification
  verifiedBy: String,
  verificationNotes: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', transactionSchema);
