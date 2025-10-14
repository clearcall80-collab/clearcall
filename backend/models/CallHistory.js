const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  roomId: {
    type: String,
    required: true
  },
  callType: {
    type: String,
    enum: ['video', 'audio'],
    default: 'video'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  participants: [{
    userId: String,
    name: String,
    joinedAt: Date,
    leftAt: Date
  }],
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'missed'],
    default: 'ongoing'
  }
});

// Index for efficient queries
callHistorySchema.index({ user: 1, startTime: -1 });

module.exports = mongoose.model('CallHistory', callHistorySchema);
