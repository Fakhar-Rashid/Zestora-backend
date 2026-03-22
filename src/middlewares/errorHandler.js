const logger = require('../utils/logger');
const { sendError } = require('../utils/responseHelper');

const errorHandler = (err, req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err.code === 'P2002') {
    return sendError(res, 'A record with this value already exists', 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'Record not found', 404);
  }

  return sendError(res, 'Internal server error', 500);
};

module.exports = errorHandler;
