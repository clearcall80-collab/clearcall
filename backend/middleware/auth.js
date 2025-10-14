const { expressjwt: jwt } = require('express-jwt');
const User = require('../models/User');

const getTokenFromHeader = (req) => {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const auth = {
  required: jwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'user',
    getToken: getTokenFromHeader,
    algorithms: ['HS256']
  }),

  optional: jwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'user',
    getToken: getTokenFromHeader,
    credentialsRequired: false,
    algorithms: ['HS256']
  }),

  // Middleware to attach full user object
  attachUser: async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
          req.user = user;
        } else {
          return res.status(401).json({ error: 'User not found' });
        }
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = auth;
