const { prisma } = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { auditLog } = require('../utils/audit');

// PAGINATION UTILITY
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// 1. GET USERS
const getUsers = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { role, isActive, search } = req.query;

  const whereClause = {};

  if (role) {
    if (['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      whereClause.role = role;
    }
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  if (search) {
    whereClause.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    data: users,
    total,
    page,
    limit,
    totalPages
  });
});

// 2. BLOCK / UNBLOCK USER
const blockUser = asyncHandler(async (req, res, next) => {
  const { userId, block } = req.body;

  if (userId === req.user.userId) {
    return next(new AppError('Admin cannot block or unblock themselves', 400));
  }

  if (block === undefined || typeof block !== 'boolean') {
    return next(new AppError('Block flag must be a boolean', 400));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update user status (isActive is the opposite of block)
  const isActive = !block;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isActive }
    });

    if (block) {
      // Revoke all refresh tokens on blocking
      await tx.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true }
      });
    }
  });

  await auditLog(req.user.userId, block ? 'USER_BLOCKED' : 'USER_UNBLOCKED', req);

  res.status(200).json({
    message: block ? 'User blocked successfully' : 'User unblocked successfully',
    user: {
      id: userId,
      isActive
    }
  });
});

// 3. CHANGE ROLE
const changeRole = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;

  if (userId === req.user.userId) {
    return next(new AppError('Admin cannot change their own role', 400));
  }

  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    return next(new AppError('Invalid role value. Must be STUDENT, TEACHER, or ADMIN', 400));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      role: true
    }
  });

  await auditLog(req.user.userId, 'ROLE_CHANGED', req);

  res.status(200).json({
    message: 'Role changed successfully',
    user: updatedUser
  });
});

// 4. DELETE USER
const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (userId === req.user.userId) {
    return next(new AppError('Admin cannot delete themselves', 400));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Delete user - schema cascade handles child records
  await prisma.user.delete({
    where: { id: userId }
  });

  await auditLog(req.user.userId, 'USER_DELETED', req);

  res.status(204).send();
});

// 5. GET AUDIT LOGS
const getLogs = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { userId, action, from, to } = req.query;

  const whereClause = {};

  if (userId) {
    whereClause.userId = userId;
  }

  if (action) {
    whereClause.action = action;
  }

  if (from || to) {
    whereClause.timestamp = {};
    if (from) {
      whereClause.timestamp.gte = new Date(from);
    }
    if (to) {
      whereClause.timestamp.lte = new Date(to);
    }
  }

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    data: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userFullName: log.user?.fullName || 'System',
      userEmail: log.user?.email || 'N/A',
      action: log.action,
      ipAddress: log.ipAddress,
      device: log.device,
      timestamp: log.timestamp
    })),
    total,
    page,
    limit,
    totalPages
  });
});

// 6. CREATE SUBJECT
const createSubject = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return next(new AppError('Subject name must be at least 2 characters', 400));
  }

  const normalizedName = name.trim();

  // Check unique subject name
  const existingSubject = await prisma.subject.findUnique({
    where: { name: normalizedName }
  });

  if (existingSubject) {
    return next(new AppError('Subject already exists', 409));
  }

  const subject = await prisma.subject.create({
    data: { name: normalizedName }
  });

  res.status(201).json({ subject });
});

// 7. GET SUBJECTS
const getSubjects = asyncHandler(async (req, res, next) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  });

  res.status(200).json(subjects);
});

module.exports = {
  getUsers,
  blockUser,
  changeRole,
  deleteUser,
  getLogs,
  createSubject,
  getSubjects
};
