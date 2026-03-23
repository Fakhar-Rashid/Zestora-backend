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

const chat = async (req, res, next) => {
  try {
    const { message, sessionId: sid } = req.body;
    if (!message) {
      return sendSuccess(res, null, 'Message is required', 400);
    }

    const workflow = await workflowService.getById(req.user.id, req.params.id);
    const version = workflow.versions?.[0];
    if (!version) {
      return sendSuccess(res, null, 'No workflow version found', 400);
    }

    const nodes = typeof version.nodesJson === 'string'
      ? JSON.parse(version.nodesJson) : version.nodesJson;
    const agentNode = nodes.find((n) => {
      const rt = n.data?.registryType || n.data?.nodeType?.type || n.type;
      return rt === 'ai-agent';
    });

    if (!agentNode) {
      return sendSuccess(res, null, 'No AI Agent node found in this workflow', 400);
    }

    const config = agentNode.data?.config || {};
    if (!config.credentialId) {
      return sendSuccess(res, null, 'AI Agent node has no credential configured. Open the node settings and select an AI credential.', 400);
    }
    if (!config.provider) {
      return sendSuccess(res, null, 'AI Agent node has no provider selected. Open the node settings and choose a provider (e.g. groq, openai).', 400);
    }

    const { getNode } = require('../engine/nodes/nodeRegistry');
    const credentialService = require('../services/credentialService');
    const logger = require('../utils/logger');
    const AIAgentClass = getNode('ai-agent');

    const context = {
      executionId: `chat-${Date.now()}`,
      workflowId: workflow.id,
      userId: req.user.id,
      credentialService,
      logger,
    };

    const handler = new AIAgentClass(config, context);
    const inputData = {
      from: sid || 'test-user',
      sessionId: sid || 'test-user',
      messageBody: message,
      messageType: 'text',
      platform: 'chat-test',
    };

    const result = await handler.execute(inputData);

    sendSuccess(res, {
      response: result.responseMessage || result.content || 'No response',
      sessionId: result.sessionId,
      toolsUsed: result.toolsUsed || [],
    }, 'Chat response');
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
  chat,
};
