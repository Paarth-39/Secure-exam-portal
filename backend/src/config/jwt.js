require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be configured in environment variables');
}

/**
 * Signs a JWT access token.
 * @param {object} payload - Payloads like { userId, email, role }
 * @returns {string} - JWT access token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
}

/**
 * Signs a JWT refresh token.
 * @param {object} payload - Payloads like { userId }
 * @returns {string} - JWT refresh token
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verifies a JWT access token. Throws if invalid or expired.
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

/**
 * Verifies a JWT refresh token. Throws if invalid or expired.
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
