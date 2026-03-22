const logger = require('../utils/logger');

const listeners = new Map();

const startEmailListener = (workflowId, credentialId, folder, userId) => {
  if (listeners.has(workflowId)) {
    logger.warn(`Email listener already exists for workflow ${workflowId}, replacing`);
    stopEmailListener(workflowId);
  }

  logger.info(`Starting email listener for workflow ${workflowId}`);
  logger.info(`  credentialId: ${credentialId}, folder: ${folder || 'INBOX'}`);

  // In production this would use imapflow to connect and listen for new emails.
  // For now we store a stub entry so the rest of the system can track it.
  const listenerInfo = {
    workflowId,
    credentialId,
    folder: folder || 'INBOX',
    userId,
    active: true,
    startedAt: new Date(),
  };

  listeners.set(workflowId, listenerInfo);
  logger.info(`Email listener registered for workflow ${workflowId}`);

  return listenerInfo;
};

const stopEmailListener = (workflowId) => {
  const listener = listeners.get(workflowId);
  if (!listener) {
    logger.debug(`No email listener found for workflow ${workflowId}`);
    return;
  }

  // In production this would close the IMAP connection.
  listeners.delete(workflowId);
  logger.info(`Stopped email listener for workflow ${workflowId}`);
};

const getActiveListeners = () => {
  const active = [];
  for (const [workflowId, info] of listeners) {
    active.push({ workflowId, ...info });
  }
  return active;
};

const stopAll = () => {
  for (const [workflowId] of listeners) {
    logger.info(`Stopping email listener for workflow ${workflowId}`);
  }
  listeners.clear();
  logger.info('All email listeners stopped');
};

module.exports = { startEmailListener, stopEmailListener, getActiveListeners, stopAll };
