const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'all', limit = 20, offset = 0 } = req.query;

    let query = { userId };

    if (status !== 'all') {
      query.status = status;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('data.eventId', 'title startTime hostName');

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { userId, status: 'unread' },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Archive notification
router.put('/:notificationId/archive', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.archive();

    res.json({ success: true });
  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({ error: 'Failed to archive notification' });
  }
});

// Delete notification
router.delete('/:notificationId', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const result = await Notification.deleteOne({
      _id: notificationId,
      userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create test notification (for development)
router.post('/test', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'system_update', title, message } = req.body;

    const notification = await Notification.create({
      userId,
      type,
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      priority: 'normal'
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

// Clean expired notifications (admin endpoint)
router.post('/clean-expired', authenticate, async (req, res) => {
  try {
    // In production, this should be restricted to admin users
    const result = await Notification.cleanExpired();
    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clean expired notifications error:', error);
    res.status(500).json({ error: 'Failed to clean expired notifications' });
  }
});

// Get notification settings (placeholder for future implementation)
router.get('/settings', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // For now, return default settings
    // In future, this could be stored in user preferences
    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      meetingReminders: true,
      systemUpdates: false,
      marketingEmails: false
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// Update notification settings (placeholder for future implementation)
router.put('/settings', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = req.body;

    // For now, just acknowledge the update
    // In future, save to user preferences
    console.log('Notification settings update for user', userId, settings);

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

module.exports = router;
