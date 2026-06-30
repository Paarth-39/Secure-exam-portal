const { verifyAccessToken } = require('../config/jwt');
const { prisma } = require('../config/db');
const AppError = require('../utils/AppError');

// In-memory cache for user active checks
const activeCheckCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  
  try {
    const token = auth.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const userId = decoded.userId;

    const now = Date.now();
    const cachedEntry = activeCheckCache.get(userId);

    let isActive = true;

    if (cachedEntry && (now - cachedEntry.cachedAt < CACHE_TTL)) {
      isActive = cachedEntry.isActive;
    } else {
      // Query database to fetch fresh user active state
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true }
      });

      if (!user) {
        return next(new AppError('User account not found', 401));
      }

      isActive = user.isActive;
      activeCheckCache.set(userId, { isActive, cachedAt: now });
    }

    if (!isActive) {
      return next(new AppError('Your account has been suspended', 403));
    }

    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return next(new AppError('Token invalid or expired', 401));
  }
};
