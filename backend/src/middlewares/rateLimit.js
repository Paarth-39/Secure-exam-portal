const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { message: 'Too many attempts, try again in 15 minutes' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: { message: 'Too many reset requests, try again in 1 hour' }
});

const examSubmitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  message: { message: 'Too many submission attempts' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  message: { message: 'Rate limit exceeded' }
});

module.exports = {
  authLimiter,
  forgotPasswordLimiter,
  examSubmitLimiter,
  apiLimiter
};
