const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const CallHistory = require('../models/CallHistory');
const router = express.Router();

// Get current user profile
router.get('/profile', auth.required, auth.attachUser, (req, res) => {
  res.json({ profile: req.user });
});

// Update user profile preferences
router.put('/profile', auth.required, auth.attachUser, async (req, res) => {
  try {
    const updates = req.body;
    const user = req.user;

    if (updates.preferences) {
      user.preferences = { ...user.preferences, ...updates.preferences };
    }

    if (updates.name) {
      user.name = updates.name;
    }

    await user.save();
    res.json({ profile: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get call history
router.get('/call-history', auth.required, auth.attachUser, async (req, res) => {
  try {
    const callHistory = await CallHistory.find({ user: req.user._id })
      .populate('contact', 'name email')
      .sort({ startTime: -1 })
      .limit(50);

    res.json({ callHistory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

// Add call history record
router.post('/call-history', auth.required, auth.attachUser, async (req, res) => {
  try {
    const { roomId, contactId, callType, startTime, endTime, duration, participants } = req.body;

    const callRecord = new CallHistory({
      user: req.user._id,
      contact: contactId,
      roomId,
      callType: callType || 'video',
      startTime,
      endTime,
      duration,
      participants,
      status: endTime ? 'completed' : 'ongoing'
    });

    await callRecord.save();

    // Add to user's call history
    req.user.callHistory.push(callRecord._id);
    await req.user.save();

    res.json({ callRecord });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add call history' });
  }
});

module.exports = router;
