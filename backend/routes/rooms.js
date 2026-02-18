const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

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

// Generate unique room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create a new room
router.post('/create', authenticate, async (req, res) => {
  try {
    const { roomName, isPrivate = false } = req.body;
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate unique room ID
    let roomId;
    let attempts = 0;
    do {
      roomId = generateRoomId();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ error: 'Failed to generate unique room ID' });
      }
    } while (await Room.findOne({ id: roomId }));

    // Create room
    const room = new Room({
      id: roomId,
      name: roomName,
      hostId: userId,
      hostName: user.name,
      isPrivate,
      participants: [{
        userId,
        name: user.name,
        email: user.email
      }]
    });

    await room.save();

    res.status(201).json({
      room: {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        hostName: room.hostName,
        isPrivate: room.isPrivate,
        participants: room.participants,
        status: room.status,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get active rooms
router.get('/active', authenticate, async (req, res) => {
  try {
    const rooms = await Room.findActiveRooms(50);

    const formattedRooms = rooms.map(room => ({
      id: room.id,
      name: room.name,
      hostName: room.hostName,
      participantCount: room.participants.length,
      createdAt: room.createdAt
    }));

    res.json({ rooms: formattedRooms });
  } catch (error) {
    console.error('Get active rooms error:', error);
    res.status(500).json({ error: 'Failed to get active rooms' });
  }
});

// Get room details
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ id: roomId })
      .populate('hostId', 'name email')
      .populate('participants.userId', 'name email');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user can access this room
    if (room.isPrivate) {
      const isParticipant = room.participants.some(p => p.userId.toString() === userId);
      const isHost = room.hostId.toString() === userId;

      if (!isParticipant && !isHost) {
        return res.status(403).json({ error: 'Access denied to private room' });
      }
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room details' });
  }
});

// Join room
router.post('/:roomId/join', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is active
    if (room.status !== 'active') {
      return res.status(400).json({ error: 'Room is not active' });
    }

    // Check if user can join
    if (room.isPrivate) {
      const isParticipant = room.participants.some(p => p.userId.toString() === userId);
      const isHost = room.hostId.toString() === userId;

      if (!isParticipant && !isHost) {
        return res.status(403).json({ error: 'Cannot join private room' });
      }
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add participant if not already in room
    await room.addParticipant(userId, user.name, user.email);

    res.json({
      participant: {
        userId,
        name: user.name,
        email: user.email,
        joinedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Leave room
router.post('/:roomId/leave', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await room.removeParticipant(userId);

    // If host leaves and no participants left, end the room
    if (room.hostId.toString() === userId && room.participants.length === 0) {
      await room.endRoom();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Update participant status
router.put('/:roomId/participants/:participantId', authenticate, async (req, res) => {
  try {
    const { roomId, participantId } = req.params;
    const { isVideoOn, isAudioOn, isHandRaised } = req.body;
    const userId = req.user.userId;

    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only allow users to update their own status or host to update anyone
    if (participantId !== userId && room.hostId.toString() !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updates = {};
    if (isVideoOn !== undefined) updates.isVideoOn = isVideoOn;
    if (isAudioOn !== undefined) updates.isAudioOn = isAudioOn;
    if (isHandRaised !== undefined) updates.isHandRaised = isHandRaised;

    await room.updateParticipantStatus(participantId, updates);

    res.json({ success: true });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// End room (host only)
router.post('/:roomId/end', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only host can end room
    if (room.hostId.toString() !== userId) {
      return res.status(403).json({ error: 'Only host can end the room' });
    }

    await room.endRoom();

    res.json({ success: true });
  } catch (error) {
    console.error('End room error:', error);
    res.status(500).json({ error: 'Failed to end room' });
  }
});

// Get user's rooms
router.get('/user/rooms', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'all', limit = 20 } = req.query;

    let query = {
      $or: [
        { hostId: userId },
        { 'participants.userId': userId }
      ]
    };

    if (status !== 'all') {
      query.status = status;
    }

    const rooms = await Room.find(query)
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Failed to get user rooms' });
  }
});

module.exports = router;
