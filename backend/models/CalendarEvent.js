const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
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
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }],
  roomId: {
    type: String,
    sparse: true // Only set when room is created
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date,
    daysOfWeek: [Number], // 0-6, Sunday = 0
    count: Number // Number of occurrences
  },
  location: {
    type: String,
    default: 'Online Meeting'
  },
  meetingType: {
    type: String,
    enum: ['video', 'audio', 'chat'],
    default: 'video'
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
    autoRecord: {
      type: Boolean,
      default: false
    },
    requirePassword: {
      type: Boolean,
      default: false
    },
    password: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification'],
      default: 'notification'
    },
    minutesBefore: {
      type: Number,
      default: 15,
      enum: [5, 10, 15, 30, 60, 1440] // minutes before event
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number, // in minutes
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attachments: [{
    name: String,
    url: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
calendarEventSchema.index({ hostId: 1, startTime: -1 });
calendarEventSchema.index({ 'participants.userId': 1 });
calendarEventSchema.index({ startTime: 1, status: 1 });
calendarEventSchema.index({ status: 1, startTime: -1 });

// Virtual for isUpcoming
calendarEventSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date() && this.status === 'scheduled';
});

// Virtual for isInProgress
calendarEventSchema.virtual('isInProgress').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.status === 'scheduled';
});

// Virtual for isPast
calendarEventSchema.virtual('isPast').get(function() {
  return this.endTime < new Date() || this.status === 'completed';
});

// Method to add participant
calendarEventSchema.methods.addParticipant = function(userId, name, email) {
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      userId,
      name,
      email
    });
  }
  return this.save();
};

// Method to update participant response
calendarEventSchema.methods.updateParticipantResponse = function(userId, status) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.status = status;
    participant.respondedAt = new Date();
  }
  return this.save();
};

// Method to start meeting
calendarEventSchema.methods.startMeeting = function() {
  this.status = 'in_progress';
  this.actualStartTime = new Date();
  return this.save();
};

// Method to end meeting
calendarEventSchema.methods.endMeeting = function() {
  this.status = 'completed';
  this.actualEndTime = new Date();
  if (this.actualStartTime) {
    this.actualDuration = Math.floor((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  return this.save();
};

// Method to cancel meeting
calendarEventSchema.methods.cancelMeeting = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static method to find upcoming events
calendarEventSchema.statics.findUpcoming = function(userId, limit = 10) {
  return this.find({
    $or: [
      { hostId: userId },
      { 'participants.userId': userId }
    ],
    startTime: { $gt: new Date() },
    status: 'scheduled'
  })
  .populate('hostId', 'name email')
  .sort({ startTime: 1 })
  .limit(limit);
};

// Static method to find events in date range
calendarEventSchema.statics.findInDateRange = function(userId, startDate, endDate) {
  return this.find({
    $or: [
      { hostId: userId },
      { 'participants.userId': userId }
    ],
    startTime: { $gte: startDate, $lte: endDate }
  })
  .populate('hostId', 'name email')
  .sort({ startTime: 1 });
};

// Static method to find events starting soon (within next hour)
calendarEventSchema.statics.findStartingSoon = function(userId) {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return this.find({
    $or: [
      { hostId: userId },
      { 'participants.userId': userId }
    ],
    startTime: { $gte: now, $lte: oneHourFromNow },
    status: 'scheduled'
  })
  .populate('hostId', 'name email')
  .sort({ startTime: 1 });
};

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
