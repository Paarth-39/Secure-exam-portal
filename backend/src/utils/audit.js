const { prisma } = require('../config/db');

/**
 * Creates an audit log entry. Does not throw on error.
 * @param {string|null} userId - The ID of the user performing the action
 * @param {string} action - The action string
 * @param {object} req - Express Request object
 */
async function auditLog(userId, action, req) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const device = req.headers['user-agent'] || 'unknown';

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : String(ipAddress),
        device
      }
    });
  } catch (error) {
    // Audit log insertion failure should never disrupt request execution.
  }
}

module.exports = {
  auditLog
};
