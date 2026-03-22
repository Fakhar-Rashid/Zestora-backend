const { Router } = require('express');

const executionController = require('../controllers/executionController');
const authenticate = require('../middlewares/auth');
const { validateQuery } = require('../middlewares/validate');
const { listQuerySchema } = require('../validators/executionValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /executions:
 *   get:
 *     tags: [Executions]
 *     summary: List executions for the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: workflowId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, running, success, failed, cancelled] }
 *     responses:
 *       200: { description: Paginated execution list }
 */
router.get('/', validateQuery(listQuerySchema), executionController.list);

/**
 * @swagger
 * /executions/stats:
 *   get:
 *     tags: [Executions]
 *     summary: Get execution statistics for the current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Execution stats }
 */
router.get('/stats', executionController.getStats);

/**
 * @swagger
 * /executions/{id}:
 *   get:
 *     tags: [Executions]
 *     summary: Get a single execution with its steps
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Execution details }
 *       404: { description: Execution not found }
 */
router.get('/:id', executionController.getById);

/**
 * @swagger
 * /executions/{id}/cancel:
 *   post:
 *     tags: [Executions]
 *     summary: Cancel a pending or running execution
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Execution cancelled }
 *       400: { description: Execution cannot be cancelled }
 *       404: { description: Execution not found }
 */
router.post('/:id/cancel', executionController.cancel);

module.exports = router;
