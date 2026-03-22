const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = { sendSuccess, sendError };
