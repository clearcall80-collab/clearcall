const express = require('express');
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const router = express.Router();

// Get contacts for current user
router.get('/', auth.required, auth.attachUser, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id }).sort({ addedAt: -1 });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Add new contact
router.post('/', auth.required, auth.attachUser, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if contact already exists for user
    const existing = await Contact.findOne({ user: req.user._id, email });
    if (existing) {
      return res.status(409).json({ error: 'Contact already exists' });
    }

    const contact = new Contact({
      user: req.user._id,
      name,
      email,
      phone
    });

    await contact.save();

    // Add to user's contacts
    req.user.contacts.push(contact._id);
    await req.user.save();

    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// Delete contact
router.delete('/:id', auth.required, auth.attachUser, async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Remove from user's contacts
    req.user.contacts = req.user.contacts.filter(id => id.toString() !== req.params.id);
    await req.user.save();

    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
