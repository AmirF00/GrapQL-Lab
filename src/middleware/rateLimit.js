const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

const createRateLimitRule = () => {
  return {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    // Remove Redis store for now to test basic functionality
    // We can add it back once basic setup is working
  };
};

module.exports = { createRateLimitRule };
