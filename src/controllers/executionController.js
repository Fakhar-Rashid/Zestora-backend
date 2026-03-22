const executionService = require('../services/executionService');
const { sendSuccess } = require('../utils/responseHelper');

const list = async (req, res, next) => {
  try {
    const result = await executionService.list(req.user.id, req.query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const execution = await executionService.getById(req.user.id, req.params.id);
    sendSuccess(res, execution);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const execution = await executionService.cancel(req.user.id, req.params.id);
    sendSuccess(res, execution, 'Execution cancelled');
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await executionService.getStats(req.user.id);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, cancel, getStats };
