const { Router } = require('express');

const credentialController = require('../controllers/credentialController');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const { createSchema, updateSchema } = require('../validators/credentialValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /credentials:
 *   get:
 *     tags: [Credentials]
 *     summary: List credentials for the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: service
 *         schema: { type: string }
 *         description: Filter by service name
 *     responses:
 *       200: { description: List of credentials }
 *       401: { description: Not authenticated }
 */
router.get('/', credentialController.list);

/**
 * @swagger
 * /credentials:
 *   post:
 *     tags: [Credentials]
 *     summary: Create a new credential
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, service, data]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [api_key, oauth2, basic_auth, bearer_token] }
 *               service: { type: string }
 *               data: { type: object }
 *     responses:
 *       201: { description: Credential created }
 *       400: { description: Validation error }
 */
router.post('/', validate(createSchema), credentialController.create);

/**
 * @swagger
 * /credentials/{id}:
 *   get:
 *     tags: [Credentials]
 *     summary: Get a credential by ID (returns decrypted data)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Decrypted credential data }
 *       404: { description: Credential not found }
 */
router.get('/:id', credentialController.getById);

/**
 * @swagger
 * /credentials/{id}:
 *   put:
 *     tags: [Credentials]
 *     summary: Update a credential
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
 *               type: { type: string, enum: [api_key, oauth2, basic_auth, bearer_token] }
 *               service: { type: string }
 *               data: { type: object }
 *     responses:
 *       200: { description: Credential updated }
 *       404: { description: Credential not found }
 */
router.put('/:id', validate(updateSchema), credentialController.update);

/**
 * @swagger
 * /credentials/{id}:
 *   delete:
 *     tags: [Credentials]
 *     summary: Delete a credential
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Credential deleted }
 *       404: { description: Credential not found }
 */
router.delete('/:id', credentialController.remove);

router.post('/:id/whatsapp/connect', credentialController.whatsappConnect);
router.get('/:id/whatsapp/status', credentialController.whatsappStatus);
router.post('/:id/whatsapp/disconnect', credentialController.whatsappDisconnect);

module.exports = router;
