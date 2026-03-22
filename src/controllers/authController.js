const authService = require('../services/authService');
const { sendSuccess } = require('../utils/responseHelper');

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    sendSuccess(res, result, 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe };
