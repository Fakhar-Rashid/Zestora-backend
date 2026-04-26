const { Router } = require('express');

const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const triggerService = require('../services/triggerService');

const router = Router();

/**
 * @swagger
 * /webhooks/{path}:
 *   post:
 *     tags: [Webhooks]
 *     summary: Incoming webhook handler - triggers workflow execution
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Webhook processed }
 *       404: { description: Webhook not found }
 */
router.post('/:path', async (req, res) => {
  try {
    const result = await triggerService.handleWebhook(
      req.params.path,
      req.body,
      req.headers,
    );
    sendSuccess(res, result, 'Webhook processed');
  } catch (err) {
    logger.error(`Webhook error on path ${req.params.path}: ${err.message}`);
    const statusCode = err.statusCode || 500;
    sendError(res, err.message, statusCode);
  }
});

module.exports = router;
