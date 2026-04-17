/**
 * Health Check Route
 * Provides a simple endpoint to verify the bot server is running.
 */

const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Returns the current status of the bot server
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Bot is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
