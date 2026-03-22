const cron = require('node-cron');

const logger = require('../utils/logger');

const jobs = new Map();

const getWorkflowEngine = () => {
  try {
    return require('./workflowEngine');
  } catch {
    logger.warn('workflowEngine not available for scheduler');
    return null;
  }
};

const schedule = (workflowId, cronExpression, userId) => {
  if (jobs.has(workflowId)) {
    logger.warn(`Job already exists for workflow ${workflowId}, replacing`);
    unschedule(workflowId);
  }

  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression "${cronExpression}" for workflow ${workflowId}`);
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  const job = cron.schedule(cronExpression, async () => {
    logger.info(`Scheduled execution triggered for workflow ${workflowId}`);
    const workflowEngine = getWorkflowEngine();
    if (!workflowEngine) {
      logger.error('workflowEngine not available, skipping scheduled execution');
      return;
    }
    try {
      await workflowEngine.executeWorkflow(workflowId, {}, 'schedule', userId);
    } catch (err) {
      logger.error(`Scheduled execution failed for workflow ${workflowId}: ${err.message}`);
    }
  });

  jobs.set(workflowId, { job, cronExpression, userId });
  logger.info(`Scheduled workflow ${workflowId} with cron: ${cronExpression}`);
};

const unschedule = (workflowId) => {
  const entry = jobs.get(workflowId);
  if (!entry) {
    logger.debug(`No scheduled job found for workflow ${workflowId}`);
    return;
  }

  entry.job.stop();
  jobs.delete(workflowId);
  logger.info(`Unscheduled workflow ${workflowId}`);
};

const getActiveJobs = () => {
  const activeJobs = [];
  for (const [workflowId, entry] of jobs) {
    activeJobs.push({
      workflowId,
      cronExpression: entry.cronExpression,
      nextRun: null,
    });
  }
  return activeJobs;
};

const stopAll = () => {
  for (const [workflowId, entry] of jobs) {
    entry.job.stop();
    logger.info(`Stopped scheduled job for workflow ${workflowId}`);
  }
  jobs.clear();
  logger.info('All scheduled jobs stopped');
};

module.exports = { schedule, unschedule, getActiveJobs, stopAll };
