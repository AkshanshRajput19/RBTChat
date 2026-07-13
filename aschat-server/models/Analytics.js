const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    default: 'default',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },

  // Session info
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  chatDuration: {
    type: Number,
    default: 0
  }, // in seconds

  // Message metrics
  messagesSent: {
    type: Number,
    default: 0
  },
  messagesReceived: {
    type: Number,
    default: 0
  },

  // Customer info
  customerName: {
    type: String,
    default: 'Anonymous'
  },
  customerEmail: {
    type: String
  },

  // AI Analysis
  sentimentScore: {
    type: Number,
    default: 0
  },
  topics: [{
    type: String
  }],
  satisfactionScore: {
    type: Number,
    default: 0
  },

  // Sales Funnel
  funnelStage: {
    type: String,
    enum: ['visitor', 'signup', 'active', 'premium', 'enterprise', 'churned'],
    default: 'visitor'
  },
  leadScore: {
    type: Number,
    default: 0
  },

  // Purchase data
  purchaseAmount: {
    type: Number,
    default: 0
  },
  purchaseDate: {
    type: Date
  }
}, { timestamps: true });

// Indexes for faster queries
analyticsSchema.index({ tenantId: 1, startTime: -1 });
analyticsSchema.index({ userId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);