const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const { authLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimit');
const passport = require('../config/passport');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.schema');

// Auth endpoints
router.post('/register', validate(registerSchema), auth.register);

router.post('/verify-email', auth.verifyEmail);

router.post('/login', validate(loginSchema), authLimiter, auth.login);

router.post('/refresh', auth.refreshToken);

router.post('/logout', authenticate, auth.logout);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordLimiter, auth.forgotPassword);

router.post('/reset-password', validate(resetPasswordSchema), auth.resetPassword);

// Google OAuth endpoints
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  auth.googleCallback
);

module.exports = router;
