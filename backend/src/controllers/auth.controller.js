const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/db');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../config/jwt');
const { sendEmail } = require('../config/email');
const { auditLog } = require('../utils/audit');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { logger } = require('../utils/logger');

// Cookie options helper
const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };
};

// 1. REGISTER
const register = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  // Check email redundancy
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    return next(new AppError('Email already registered', 409));
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create User directly with emailVerified: true
  const user = await prisma.user.create({
    data: {
      fullName,
      email: normalizedEmail,
      passwordHash,
      role,
      provider: 'LOCAL',
      emailVerified: true,
      isActive: true
    }
  });

  // Log Audit
  await auditLog(user.id, 'REGISTER', req);

  res.status(201).json({
    message: 'User registered successfully!'
  });
});

// 2. VERIFY EMAIL
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!tokenRecord) {
    return next(new AppError('Invalid or expired token', 400));
  }

  if (tokenRecord.expiresAt < new Date()) {
    // Delete expired token record
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
    return next(new AppError('Token has expired', 400));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true }
    }),
    prisma.verificationToken.delete({
      where: { id: tokenRecord.id }
    })
  ]);

  await auditLog(tokenRecord.userId, 'EMAIL_VERIFIED', req);

  res.status(200).json({
    message: 'Email verified. You can now log in.'
  });
});

// 3. LOGIN
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || user.provider !== 'LOCAL') {
    return next(new AppError('Invalid credentials', 401));
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid credentials', 401));
  }

  // if (!user.emailVerified) {
  //   return next(new AppError('Please verify your email first', 403));
  // }

  if (!user.isActive) {
    return next(new AppError('Your account has been suspended', 403));
  }

  const accessTokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(accessTokenPayload);
  const refreshToken = signRefreshToken({ userId: user.id });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt
    }
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());

  await auditLog(user.id, 'LOGIN', req);

  res.status(200).json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    accessToken
  });
});

// 4. REFRESH TOKEN
const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return next(new AppError('Refresh token required', 401));
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    return next(new AppError('Token invalid or expired', 401));
  }

  const dbToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
    return next(new AppError('Token invalid, revoked, or expired', 401));
  }

  if (!dbToken.user.isActive) {
    return next(new AppError('User account suspended', 403));
  }

  const accessTokenPayload = {
    userId: dbToken.user.id,
    email: dbToken.user.email,
    role: dbToken.user.role
  };
  const accessToken = signAccessToken(accessTokenPayload);

  res.status(200).json({
    accessToken
  });
});

// 5. LOGOUT
const logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (token) {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true }
    }).catch(() => {});
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  if (req.user && req.user.userId) {
    await auditLog(req.user.userId, 'LOGOUT', req);
  }

  res.status(200).json({
    message: 'Logged out successfully'
  });
});

// 6. FORGOT PASSWORD
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || user.provider !== 'LOCAL') {
    // Silent return to prevent email enumeration
    return res.status(200).json({
      message: 'If that email exists, a reset link has been sent'
    });
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  await sendEmail({
    to: normalizedEmail,
    subject: 'Reset Your Password - SecureExam',
    templateName: 'reset-password',
    variables: {
      FULL_NAME: user.fullName,
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
      TOKEN: token
    }
  });

  await auditLog(user.id, 'PASSWORD_RESET_REQUESTED', req);

  res.status(200).json({
    message: 'If that email exists, a reset link has been sent'
  });
});

// 7. RESET PASSWORD
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
    return next(new AppError('Invalid or expired token', 400));
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    // Update Password
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash }
    }),
    // Mark token as used
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true }
    }),
    // Revoke all refresh tokens
    prisma.refreshToken.updateMany({
      where: { userId: tokenRecord.userId },
      data: { revoked: true }
    })
  ]);

  await auditLog(tokenRecord.userId, 'PASSWORD_RESET_COMPLETED', req);

  res.status(200).json({
    message: 'Password reset successfully. Please log in.'
  });
});

// 8. GOOGLE OAUTH CALLBACK
const googleCallback = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError('OAuth authentication failed', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been suspended', 403));
  }

  const accessTokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(accessTokenPayload);
  const refreshToken = signRefreshToken({ userId: user.id });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt
    }
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());

  await auditLog(user.id, 'LOGIN_GOOGLE', req);

  const frontendRedirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/success?accessToken=${accessToken}`;
  res.redirect(frontendRedirectUrl);
});

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback
};
