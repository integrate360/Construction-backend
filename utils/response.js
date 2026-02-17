/**
 * Send a standardized API response
 */
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

exports.successResponse = (res, message, data, meta) =>
  sendResponse(res, 200, true, message, data, meta);

exports.createdResponse = (res, message, data) =>
  sendResponse(res, 201, true, message, data);

exports.errorResponse = (res, statusCode, message) =>
  sendResponse(res, statusCode, false, message);
