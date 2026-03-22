const workflowService = require('../services/workflowService');
const triggerService = require('../services/triggerService');
const { sendSuccess } = require('../utils/responseHelper');

const getWorkflowEngine = () => {
  try {
    return require('../engine/workflowEngine');
  } catch {
    return null;
  }
};

const create = async (req, res, next) => {
  try {
    const workflow = await workflowService.create(req.user.id, req.body);
    sendSuccess(res, workflow, 'Workflow created', 201);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const workflows = await workflowService.list(req.user.id);
    sendSuccess(res, workflows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const workflow = await workflowService.getById(req.user.id, req.params.id);
    sendSuccess(res, workflow);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const workflow = await workflowService.update(req.user.id, req.params.id, req.body);
    sendSuccess(res, workflow, 'Workflow updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await workflowService.remove(req.user.id, req.params.id);
    sendSuccess(res, null, 'Workflow deleted');
  } catch (err) {
    next(err);
  }
};

const saveVersion = async (req, res, next) => {
  try {
    const version = await workflowService.saveVersion(req.user.id, req.params.id, req.body);
    sendSuccess(res, version, 'Version saved', 201);
  } catch (err) {
    next(err);
  }
};

const listVersions = async (req, res, next) => {
  try {
    const versions = await workflowService.listVersions(req.user.id, req.params.id);
    sendSuccess(res, versions);
  } catch (err) {
    next(err);
  }
};

const getVersion = async (req, res, next) => {
  try {
    const version = await workflowService.getVersion(
      req.user.id,
      req.params.id,
      Number(req.params.version),
    );
    sendSuccess(res, version);
  } catch (err) {
    next(err);
  }
};

const execute = async (req, res, next) => {
  try {
    const workflowEngine = getWorkflowEngine();
    if (!workflowEngine) {
      return sendSuccess(res, null, 'Workflow engine not available yet');
    }
    const result = await workflowEngine.executeWorkflow(
      req.params.id,
      req.body || {},
      'manual',
      req.user.id,
    );
    sendSuccess(res, result, 'Execution started');
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await triggerService.activate(req.user.id, req.params.id);
    sendSuccess(res, result, 'Workflow activated');
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    await triggerService.deactivate(req.user.id, req.params.id);
    sendSuccess(res, null, 'Workflow deactivated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  saveVersion,
  listVersions,
  getVersion,
  execute,
  activate,
  deactivate,
};
