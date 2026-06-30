require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimit');
const AppError = require('./utils/AppError');
const { logger } = require('./utils/logger');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Initialize passport
app.use(passport.initialize());

// Security & utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ----------------------------------------------------
// BELT-AND-SUSPENDERS: JSON Response Interceptor
// ----------------------------------------------------
function sanitizeKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeKeys);
  }
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === 'correctOption' || key === 'correct_option') {
        continue; // strip the correct answer key
      }
      newObj[key] = sanitizeKeys(obj[key]);
    }
  }
  return newObj;
}

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    const sanitizedBody = sanitizeKeys(body);
    return originalJson.call(this, sanitizedBody);
  };

  const originalSend = res.send;
  res.send = function (body) {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        const sanitized = sanitizeKeys(parsed);
        return originalSend.call(this, JSON.stringify(sanitized));
      } catch (e) {
        // Not a JSON string, proceed normally
      }
    }
    return originalSend.call(this, body);
  };
  next();
});

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Capture unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle Prisma Database Errors (prevent raw leaks)
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Resource already exists';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else {
      statusCode = 400;
      message = 'Database operation failed';
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Log 5xx errors securely to console.error
  if (statusCode >= 500) {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] ERROR ${statusCode} on ${req.method} ${req.path}: ${err.stack || err.message}`
    );
  }

  const response = {
    status: 'error',
    message
  };

  // Strip stack traces in production
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

module.exports = app;
