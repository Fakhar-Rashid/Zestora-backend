const jwt = require('jsonwebtoken');

const env = require('../config/env');
const { sendError } = require('../utils/responseHelper');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

module.exports = authenticate;
