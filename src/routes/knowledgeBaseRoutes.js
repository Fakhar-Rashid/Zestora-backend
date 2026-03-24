const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /workflows/{workflowId}/knowledge:
 *   get:
 *     tags: [Knowledge Base]
 *     summary: List all knowledge entries for a workflow
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of knowledge entries }
 */
router.get('/:workflowId/knowledge', knowledgeBaseController.list);

/**
 * @swagger
 * /workflows/{workflowId}/knowledge:
 *   post:
 *     tags: [Knowledge Base]
 *     summary: Create a new knowledge entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *     responses:
 *       201: { description: Knowledge entry created }
 */
router.post('/:workflowId/knowledge', knowledgeBaseController.create);

/**
 * @swagger
 * /workflows/{workflowId}/knowledge/{id}:
 *   put:
 *     tags: [Knowledge Base]
 *     summary: Update a knowledge entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Knowledge entry updated }
 */
router.put('/:workflowId/knowledge/:id', knowledgeBaseController.update);

/**
 * @swagger
 * /workflows/{workflowId}/knowledge/{id}:
 *   delete:
 *     tags: [Knowledge Base]
 *     summary: Delete a knowledge entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Knowledge entry deleted }
 */
router.delete('/:workflowId/knowledge/:id', knowledgeBaseController.remove);

module.exports = router;
