/**
 * Validation utilities
 */

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate required fields
 */
function validateRequired(data, fields) {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null
  };
}

/**
 * Validate role
 */
function isValidRole(role, allowedRoles = ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'INSTRUCTOR', 'STUDENT']) {
  return allowedRoles.includes(role?.toUpperCase());
}

/**
 * Validate pagination parameters
 */
function validatePagination(page, size, maxSize = 100) {
  const pageNum = parseInt(page) || 0;
  const sizeNum = parseInt(size) || 10;
  const validSize = Math.min(Math.max(1, sizeNum), maxSize);
  const validPage = Math.max(0, pageNum);
  
  return {
    page: validPage,
    size: validSize,
    offset: validPage * validSize
  };
}

/**
 * Validate sort parameters
 */
function validateSort(sort, allowedColumns, defaultSort = 'name') {
  const allowed = allowedColumns.includes(sort) ? sort : defaultSort;
  return allowed;
}

/**
 * Validate sort type (ASC/DESC)
 */
function validateSortType(type, defaultType = 'ASC') {
  return type?.toUpperCase() === 'DESC' ? 'DESC' : defaultType;
}

module.exports = {
  isValidEmail,
  validateRequired,
  isValidRole,
  validatePagination,
  validateSort,
  validateSortType
};

