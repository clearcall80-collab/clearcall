const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const router = express.Router();

// Get messages for a room
router.get('/:roomId', auth.required, auth.attachUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? new Date(req.query.before) : new Date();

    const messages = await Message.find({
      roomId,
      timestamp: { $lt: before }
    })
    .populate('sender', 'name')
    .sort({ timestamp: -1 })
    .limit(limit);

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Get message logs (admin only - simplified for demo)
router.get('/logs/all', auth.required, auth.attachUser, async (req, res) => {
  try {
    // In production, add admin check
    const messages = await Message.find()
      .populate('sender', 'name email')
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get message logs' });
  }
});

module.exports = router;
