const { Router } = require('express');

const authenticate = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { getAllNodeMetas } = require('../engine/nodes/nodeRegistry');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /nodes/registry:
 *   get:
 *     tags: [Nodes]
 *     summary: Get all available node types and their metadata
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of node type definitions }
 *       500: { description: Failed to load node registry }
 */
router.get('/registry', (req, res, next) => {
  try {
    sendSuccess(res, getAllNodeMetas());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
