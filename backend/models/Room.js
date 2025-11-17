const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: null
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isVideoOn: {
      type: Boolean,
      default: true
    },
    isAudioOn: {
      type: Boolean,
      default: true
    },
    isHandRaised: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'ended', 'scheduled'],
    default: 'active'
  },
  settings: {
    allowChat: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 10
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
roomSchema.index({ hostId: 1, status: 1 });
roomSchema.index({ 'participants.userId': 1 });
roomSchema.index({ status: 1, createdAt: -1 });

// Virtual for active participants count
roomSchema.virtual('activeParticipantsCount').get(function() {
  return this.participants.length;
});

// Method to add participant
roomSchema.methods.addParticipant = function(userId, name, email) {
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      userId,
      name,
      email,
      joinedAt: new Date()
    });
  }
  return this.save();
};

// Method to remove participant
roomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.userId.toString() !== userId.toString());
  return this.save();
};

// Method to update participant status
roomSchema.methods.updateParticipantStatus = function(userId, updates) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    Object.assign(participant, updates);
  }
  return this.save();
};

// Method to end room
roomSchema.methods.endRoom = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  return this.save();
};

// Static method to find active rooms
roomSchema.statics.findActiveRooms = function(limit = 50) {
  return this.find({ status: 'active' })
    .populate('hostId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find rooms by host
roomSchema.statics.findByHost = function(hostId) {
  return this.find({ hostId })
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Room', roomSchema);
