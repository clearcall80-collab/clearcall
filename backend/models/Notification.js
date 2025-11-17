const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'meeting_invitation',
      'meeting_reminder',
      'meeting_started',
      'meeting_cancelled',
      'meeting_updated',
      'call_missed',
      'call_received',
      'contact_request',
      'system_update',
      'security_alert',
      'feature_announcement'
    ]
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 1000
  },
  data: {
    // Flexible object for additional notification data
    roomId: String,
    eventId: String,
    contactId: String,
    meetingId: String,
    callId: String,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true
  },
  deliveryMethods: [{
    type: String,
    enum: ['in_app', 'email', 'push', 'sms'],
    default: ['in_app']
  }],
  deliveryStatus: {
    in_app: {
      type: String,
      enum: ['pending', 'delivered', 'failed'],
      default: 'delivered'
    },
    email: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
      default: null
    },
    push: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: null
    },
    sms: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: null
    }
  },
  scheduledFor: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  readAt: Date,
  archivedAt: Date,
  actions: [{
    label: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['join_meeting', 'view_details', 'accept_invitation', 'decline_invitation', 'mark_read', 'dismiss']
    },
    url: String,
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for isExpired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for isActionable
notificationSchema.virtual('isActionable').get(function() {
  return this.actions && this.actions.length > 0;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as archived
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(method, status) {
  if (this.deliveryStatus[method] !== undefined) {
    this.deliveryStatus[method] = status;
  }
  return this.save();
};

// Static method to create meeting invitation
notificationSchema.statics.createMeetingInvitation = function(userId, eventData) {
  return this.create({
    userId,
    type: 'meeting_invitation',
    title: `Meeting Invitation: ${eventData.title}`,
    message: `You've been invited to "${eventData.title}" on ${eventData.startTime.toLocaleDateString()}`,
    data: {
      eventId: eventData._id,
      meetingId: eventData._id
    },
    priority: 'normal',
    actions: [
      {
        label: 'Accept',
        action: 'accept_invitation',
        data: { eventId: eventData._id }
      },
      {
        label: 'Decline',
        action: 'decline_invitation',
        data: { eventId: eventData._id }
      }
    ]
  });
};

// Static method to create meeting reminder
notificationSchema.statics.createMeetingReminder = function(userId, eventData, minutesBefore) {
  return this.create({
    userId,
    type: 'meeting_reminder',
    title: `Meeting Reminder: ${eventData.title}`,
    message: `Your meeting "${eventData.title}" starts in ${minutesBefore} minutes`,
    data: {
      eventId: eventData._id,
      minutesBefore
    },
    priority: 'high',
    scheduledFor: new Date(eventData.startTime.getTime() - minutesBefore * 60 * 1000),
    actions: [
      {
        label: 'Join Meeting',
        action: 'join_meeting',
        data: { eventId: eventData._id }
      }
    ]
  });
};

// Static method to create call notification
notificationSchema.statics.createCallNotification = function(userId, callData, type = 'call_received') {
  const title = type === 'call_missed' ? 'Missed Call' : 'Incoming Call';
  const message = type === 'call_missed'
    ? `You missed a call from ${callData.callerName}`
    : `${callData.callerName} is calling you`;

  return this.create({
    userId,
    type,
    title,
    message,
    data: {
      callId: callData.callId,
      callerId: callData.callerId,
      callerName: callData.callerName
    },
    priority: type === 'call_missed' ? 'normal' : 'urgent',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    actions: type !== 'call_missed' ? [
      {
        label: 'Answer',
        action: 'join_meeting',
        data: { callId: callData.callId }
      }
    ] : []
  });
};

// Static method to get unread notifications
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    status: 'unread',
    expiresAt: { $gt: new Date() }
  });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = function(userId, limit = 20) {
  return this.find({
    userId,
    expiresAt: { $gt: new Date() }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('data.eventId', 'title startTime hostName');
};

// Static method to clean expired notifications
notificationSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
