const { Router } = require('express');

const workflowController = require('../controllers/workflowController');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const {
  createSchema,
  updateSchema,
  saveVersionSchema,
} = require('../validators/workflowValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /workflows:
 *   get:
 *     tags: [Workflows]
 *     summary: List all workflows for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Workflow list }
 */
router.get('/', workflowController.list);

/**
 * @swagger
 * /workflows:
 *   post:
 *     tags: [Workflows]
 *     summary: Create a new workflow
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Workflow created }
 */
router.post('/', validate(createSchema), workflowController.create);

/**
 * @swagger
 * /workflows/{id}:
 *   get:
 *     tags: [Workflows]
 *     summary: Get workflow by ID with current version
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workflow details }
 *       404: { description: Not found }
 */
router.get('/:id', workflowController.getById);

/**
 * @swagger
 * /workflows/{id}:
 *   put:
 *     tags: [Workflows]
 *     summary: Update workflow
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *               triggerType: { type: string }
 *               cronExpression: { type: string }
 *     responses:
 *       200: { description: Workflow updated }
 *       404: { description: Not found }
 */
router.put('/:id', validate(updateSchema), workflowController.update);

/**
 * @swagger
 * /workflows/{id}:
 *   delete:
 *     tags: [Workflows]
 *     summary: Delete workflow
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workflow deleted }
 *       404: { description: Not found }
 */
router.delete('/:id', workflowController.remove);

/**
 * @swagger
 * /workflows/{id}/versions:
 *   post:
 *     tags: [Workflows]
 *     summary: Save a new workflow version
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nodesJson, edgesJson]
 *             properties:
 *               nodesJson: { type: array }
 *               edgesJson: { type: array }
 *               viewportJson: { type: object }
 *     responses:
 *       201: { description: Version saved }
 *       404: { description: Workflow not found }
 */
router.post('/:id/versions', validate(saveVersionSchema), workflowController.saveVersion);

/**
 * @swagger
 * /workflows/{id}/versions:
 *   get:
 *     tags: [Workflows]
 *     summary: List all versions of a workflow
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Version list }
 *       404: { description: Workflow not found }
 */
router.get('/:id/versions', workflowController.listVersions);

/**
 * @swagger
 * /workflows/{id}/versions/{version}:
 *   get:
 *     tags: [Workflows]
 *     summary: Get a specific workflow version
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: version
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Version details }
 *       404: { description: Version not found }
 */
router.get('/:id/versions/:version', workflowController.getVersion);

/**
 * @swagger
 * /workflows/{id}/execute:
 *   post:
 *     tags: [Workflows]
 *     summary: Execute a workflow (stub)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Execution started }
 */
router.post('/:id/execute', workflowController.execute);

/**
 * @swagger
 * /workflows/{id}/activate:
 *   put:
 *     tags: [Workflows]
 *     summary: Activate a workflow (stub)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workflow activated }
 */
router.put('/:id/activate', workflowController.activate);

/**
 * @swagger
 * /workflows/{id}/deactivate:
 *   put:
 *     tags: [Workflows]
 *     summary: Deactivate a workflow (stub)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workflow deactivated }
 */
router.put('/:id/deactivate', workflowController.deactivate);

module.exports = router;
