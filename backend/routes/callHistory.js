const express = require('express');
const auth = require('../middleware/auth');
const CallHistory = require('../models/CallHistory');
const router = express.Router();

// Get call history for current user
router.get('/', auth.required, auth.attachUser, async (req, res) => {
  try {
    const callHistory = await CallHistory.find({ user: req.user._id })
      .populate('contact', 'name email')
      .sort({ startTime: -1 })
      .limit(100);

    res.json({ callHistory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

// Get specific call history record
router.get('/:id', auth.required, auth.attachUser, async (req, res) => {
  try {
    const callRecord = await CallHistory.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('contact', 'name email');

    if (!callRecord) {
      return res.status(404).json({ error: 'Call record not found' });
    }

    res.json({ callRecord });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get call record' });
  }
});

// Update call history (for ending calls)
router.put('/:id', auth.required, auth.attachUser, async (req, res) => {
  try {
    const updates = req.body;
    const callRecord = await CallHistory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    ).populate('contact', 'name email');

    if (!callRecord) {
      return res.status(404).json({ error: 'Call record not found' });
    }

    res.json({ callRecord });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update call record' });
  }
});

module.exports = router;
