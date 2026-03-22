const app = require('./app');

const env = require('./config/env');
const logger = require('./utils/logger');

const start = async () => {
  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
    logger.info(`Swagger docs at http://localhost:${env.port}/api-docs`);
  });
};

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

start();
