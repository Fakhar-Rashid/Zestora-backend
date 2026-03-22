const { Router } = require('express');

const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const triggerService = require('../services/triggerService');

const router = Router();

/**
 * @swagger
 * /webhooks/{path}:
 *   get:
 *     tags: [Webhooks]
 *     summary: WhatsApp verification endpoint (hub.challenge)
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: hub.mode
 *         schema: { type: string }
 *       - in: query
 *         name: hub.verify_token
 *         schema: { type: string }
 *       - in: query
 *         name: hub.challenge
 *         schema: { type: string }
 *     responses:
 *       200: { description: Verification successful }
 *       403: { description: Verification failed }
 */
router.get('/:path', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.whatsappVerifyToken) {
    logger.info(`WhatsApp verification successful for path: ${req.params.path}`);
    return res.status(200).send(challenge);
  }

  return sendError(res, 'Webhook verification failed', 403);
});

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
