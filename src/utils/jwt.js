/**
 * JWT utilities
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Generate JWT token
 */
function generateToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Decode JWT token (without verification)
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};

