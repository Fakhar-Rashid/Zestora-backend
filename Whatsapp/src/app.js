/**
 * App Entry Point
 * Loads environment variables, starts the Express server,
 * and initializes the WhatsApp client.
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const healthRoute = require('./routes/health');
const { initializeClient } = require('./bot/client');
const logger = require('./utils/logger');

// Express app setup
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/', healthRoute);

/**
 * Start the application
 * 1. Start Express server for health checks
 * 2. Initialize WhatsApp client for message handling
 */
const start = async () => {
  try {
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Express server running on http://localhost:${PORT}`);
      logger.info(`📡 Health check available at http://localhost:${PORT}/health`);
    });

    // Initialize WhatsApp client
    logger.info('Starting WhatsApp bot...');
    await initializeClient();
  } catch (error) {
    logger.error('Failed to start the application', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Launch the application
start();
