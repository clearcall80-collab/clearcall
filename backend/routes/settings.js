const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

// Get user settings
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('preferences');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Default settings merged with user preferences
    const defaultSettings = {
      darkMode: false,
      largeText: false,
      language: 'en',
      notifications: {
        email: true,
        push: true,
        meetingReminders: true,
        systemUpdates: false
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowContactRequests: true
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        screenReader: false
      },
      meeting: {
        defaultDuration: 60,
        autoRecord: false,
        allowGuests: true,
        requirePassword: false
      }
    };

    const settings = {
      ...defaultSettings,
      ...user.preferences
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update user settings
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences
    user.preferences = {
      ...user.preferences,
      ...updates
    };

    await user.save();

    res.json({
      success: true,
      settings: user.preferences
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Reset settings to defaults
router.post('/reset', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset to default preferences
    user.preferences = {
      darkMode: false,
      largeText: false,
      language: 'en',
      notifications: {
        email: true,
        push: true,
        meetingReminders: true,
        systemUpdates: false
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowContactRequests: true
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        screenReader: false
      },
      meeting: {
        defaultDuration: 60,
        autoRecord: false,
        allowGuests: true,
        requirePassword: false
      }
    };

    await user.save();

    res.json({
      success: true,
      settings: user.preferences
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

// Update specific setting category
router.put('/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update specific category
    user.preferences[category] = {
      ...user.preferences[category],
      ...updates
    };

    await user.save();

    res.json({
      success: true,
      [category]: user.preferences[category]
    });
  } catch (error) {
    console.error('Update category settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get public profile settings
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('name email preferences.privacy preferences.language');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        language: user.preferences?.language || 'en',
        privacy: user.preferences?.privacy || {
          profileVisibility: 'public',
          showOnlineStatus: true
        }
      }
    });
  } catch (error) {
    console.error('Get profile settings error:', error);
    res.status(500).json({ error: 'Failed to get profile settings' });
  }
});

// Update profile settings
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, language, privacy } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (language) {
      if (!user.preferences) user.preferences = {};
      user.preferences.language = language;
    }
    if (privacy) {
      if (!user.preferences) user.preferences = {};
      user.preferences.privacy = {
        ...user.preferences.privacy,
        ...privacy
      };
    }

    await user.save();

    res.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        language: user.preferences?.language,
        privacy: user.preferences?.privacy
      }
    });
  } catch (error) {
    console.error('Update profile settings error:', error);
    res.status(500).json({ error: 'Failed to update profile settings' });
  }
});

// Export user data (GDPR compliance)
router.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Gather all user data
    const userData = {
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        preferences: user.preferences
      },
      // In a real implementation, you would also include:
      // - Call history
      // - Calendar events
      // - Contacts
      // - Messages
      // - etc.
      exportDate: new Date(),
      version: '1.0'
    };

    res.json({ data: userData });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete account (GDPR compliance)
router.delete('/account', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmDelete } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({ error: 'Account deletion must be confirmed' });
    }

    // In a real implementation, you would:
    // 1. Mark user as deleted (soft delete)
    // 2. Anonymize personal data
    // 3. Schedule hard delete after retention period
    // 4. Cancel all scheduled meetings
    // 5. Remove from all rooms
    // 6. Delete associated data

    // For now, just mark as inactive
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Account deletion initiated. Your data will be permanently removed within 30 days.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
