/**
 * Password utilities
 */
const bcrypt = require("bcryptjs");

/**
 * Hash password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Check if password is already hashed
 */
function isPasswordHashed(password) {
  if (!password) return false;
  // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
  return /^\$2[ayb]\$.{56}$/.test(password);
}

module.exports = {
  hashPassword,
  comparePassword,
  isPasswordHashed
};

