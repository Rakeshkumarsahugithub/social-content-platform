const rateLimit = require('express-rate-limit');

// General API rate limiter
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        message,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Different rate limiters for different endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests, please try again later'
);

const postLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 posts
  'Too many posts created, please try again later'
);

const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 uploads
  'Too many file uploads, please try again later'
);

const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 searches
  'Too many search requests, please slow down'
);

const adminLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  200, // 200 admin actions
  'Too many admin actions, please try again later'
);

module.exports = {
  authLimiter,
  generalLimiter,
  postLimiter,
  uploadLimiter,
  searchLimiter,
  adminLimiter
};
