/**
 * Response utilities
 */

/**
 * Send success response
 */
function sendSuccess(res, data, message = null, statusCode = 200) {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
function sendError(res, message, statusCode = 400, errors = null) {
  const response = {
    success: false,
    message
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

/**
 * Send paginated response
 */
function sendPaginated(res, content, totalElements, page, size) {
  return res.json({
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    size,
    number: page,
    first: page === 0,
    last: page >= Math.ceil(totalElements / size) - 1,
    numberOfElements: content.length
  });
}

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};

