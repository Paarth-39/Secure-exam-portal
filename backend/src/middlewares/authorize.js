const AppError = require('../utils/AppError');

/**
 * Authorization middleware by role.
 * @param {...string} roles - Array of user roles
 */
module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Access denied', 403));
  }
  next();
};
