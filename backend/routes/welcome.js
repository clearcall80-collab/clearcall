const express = require('express');
const router = express.Router();

// Simple logging middleware for this route
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);

  // Log request headers (optional, for debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
  }

  next();
};

// Apply logging middleware to all routes in this file
router.use(requestLogger);

// Welcome endpoint
router.get('/welcome', (req, res) => {
  console.log('Processing welcome request...');

  const response = {
    message: 'Welcome to the Clear Call API Service!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    status: 'active'
  };

  console.log('Sending welcome response:', response);

  res.json(response);
});

// Health check endpoint with logging
router.get('/health', (req, res) => {
  console.log('Health check requested');

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Info endpoint
router.get('/info', (req, res) => {
  console.log('API info requested');

  res.json({
    name: 'Clear Call API',
    version: '1.0.0',
    description: 'Video calling and communication platform API',
    endpoints: [
      '/api/welcome',
      '/api/health',
      '/api/info'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
