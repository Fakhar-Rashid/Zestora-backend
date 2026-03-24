const knowledgeBaseService = require('../services/knowledgeBaseService');
const workflowService = require('../services/workflowService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * List all knowledge entries for a workflow.
 */
const list = async (req, res, next) => {
  try {
    // Verify user owns this workflow
    await workflowService.getById(req.user.id, req.params.workflowId);
    const entries = await knowledgeBaseService.getAll(req.params.workflowId);
    sendSuccess(res, entries);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new knowledge entry.
 */
const create = async (req, res, next) => {
  try {
    await workflowService.getById(req.user.id, req.params.workflowId);
    const { title, content, category } = req.body;

    if (!title || !content) {
      return sendError(res, 'Title and content are required', 400);
    }

    const entry = await knowledgeBaseService.create(req.params.workflowId, {
      title,
      content,
      category,
    });
    sendSuccess(res, entry, 'Knowledge entry created', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a knowledge entry.
 */
const update = async (req, res, next) => {
  try {
    await workflowService.getById(req.user.id, req.params.workflowId);
    const entry = await knowledgeBaseService.update(req.params.id, req.body);
    sendSuccess(res, entry, 'Knowledge entry updated');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a knowledge entry.
 */
const remove = async (req, res, next) => {
  try {
    await workflowService.getById(req.user.id, req.params.workflowId);
    await knowledgeBaseService.remove(req.params.id);
    sendSuccess(res, null, 'Knowledge entry deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
