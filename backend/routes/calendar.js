const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
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

// Create calendar event
router.post('/events', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      duration,
      participants = [],
      recurrence,
      settings,
      reminders = []
    } = req.body;

    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate end time if duration provided
    let eventEndTime = endTime;
    if (!eventEndTime && duration) {
      eventEndTime = new Date(new Date(startTime).getTime() + duration * 60 * 1000);
    }

    // Create event
    const event = new CalendarEvent({
      title,
      description,
      hostId: userId,
      hostName: user.name,
      startTime,
      endTime: eventEndTime,
      duration: duration || Math.floor((new Date(eventEndTime) - new Date(startTime)) / (1000 * 60)),
      participants: participants.map(p => ({
        userId: p.userId,
        name: p.name,
        email: p.email
      })),
      recurrence: recurrence || { type: 'none' },
      settings: settings || {},
      reminders: reminders.length > 0 ? reminders : [{ minutesBefore: 15 }]
    });

    await event.save();

    // Create notifications for participants
    for (const participant of participants) {
      if (participant.userId !== userId) {
        await Notification.createMeetingInvitation(participant.userId, event);
      }
    }

    res.status(201).json({ event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get user's events
router.get('/events', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, status = 'all', limit = 50 } = req.query;

    let query = {
      $or: [
        { hostId: userId },
        { 'participants.userId': userId }
      ]
    };

    if (status !== 'all') {
      query.status = status;
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const events = await CalendarEvent.find(query)
      .populate('hostId', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startTime: 1 })
      .limit(parseInt(limit));

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get upcoming events
router.get('/events/upcoming', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const events = await CalendarEvent.findUpcoming(userId, 10);
    res.json({ events });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

// Get events starting soon
router.get('/events/starting-soon', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const events = await CalendarEvent.findStartingSoon(userId);
    res.json({ events });
  } catch (error) {
    console.error('Get starting soon events error:', error);
    res.status(500).json({ error: 'Failed to get events starting soon' });
  }
});

// Get single event
router.get('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const event = await CalendarEvent.findById(eventId)
      .populate('hostId', 'name email')
      .populate('participants.userId', 'name email');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has access to this event
    const isHost = event.hostId._id.toString() === userId;
    const isParticipant = event.participants.some(p => p.userId._id.toString() === userId);

    if (!isHost && !isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// Update event
router.put('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only host can update event
    if (event.hostId.toString() !== userId) {
      return res.status(403).json({ error: 'Only host can update event' });
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'startTime', 'endTime', 'duration',
      'participants', 'recurrence', 'settings', 'reminders'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        event[field] = updates[field];
      }
    });

    await event.save();

    // Create update notifications for participants
    for (const participant of event.participants) {
      if (participant.userId.toString() !== userId) {
        await Notification.create({
          userId: participant.userId,
          type: 'meeting_updated',
          title: `Meeting Updated: ${event.title}`,
          message: `The meeting "${event.title}" has been updated`,
          data: { eventId: event._id },
          priority: 'normal'
        });
      }
    }

    res.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only host can delete event
    if (event.hostId.toString() !== userId) {
      return res.status(403).json({ error: 'Only host can delete event' });
    }

    await event.remove();

    // Create cancellation notifications
    for (const participant of event.participants) {
      if (participant.userId.toString() !== userId) {
        await Notification.create({
          userId: participant.userId,
          type: 'meeting_cancelled',
          title: `Meeting Cancelled: ${event.title}`,
          message: `The meeting "${event.title}" has been cancelled`,
          data: { eventId: event._id },
          priority: 'normal'
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Respond to event invitation
router.post('/events/:eventId/respond', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // 'accepted', 'declined', 'tentative'
    const userId = req.user.userId;

    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.updateParticipantResponse(userId, status);

    res.json({ success: true });
  } catch (error) {
    console.error('Respond to event error:', error);
    res.status(500).json({ error: 'Failed to respond to event' });
  }
});

// Start meeting from calendar event
router.post('/events/:eventId/start', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only host can start meeting
    if (event.hostId.toString() !== userId) {
      return res.status(403).json({ error: 'Only host can start meeting' });
    }

    await event.startMeeting();

    // Create room for the meeting
    const Room = require('../models/Room');
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = new Room({
      id: roomId,
      name: event.title,
      hostId: userId,
      hostName: event.hostName,
      participants: event.participants.map(p => ({
        userId: p.userId,
        name: p.name,
        email: p.email
      }))
    });

    await room.save();

    // Update event with room ID
    event.roomId = roomId;
    await event.save();

    res.json({ roomId, event });
  } catch (error) {
    console.error('Start meeting error:', error);
    res.status(500).json({ error: 'Failed to start meeting' });
  }
});

module.exports = router;
