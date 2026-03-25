const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const logger = require('../utils/logger');
const credentialService = require('./credentialService');

const listeners = new Map();

const buildImapConfig = (cred) => ({
  host: cred.host,
  port: parseInt(cred.port, 10) || 993,
  secure: cred.secure !== false,
  auth: { user: cred.email || cred.user, pass: cred.password || cred.pass },
  logger: false,
});

const pollOnce = async (imapConfig, folder, onEmail) => {
  const client = new ImapFlow(imapConfig);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const since = new Date(Date.now() - 60 * 1000);
      const uids = await client.search({ since, seen: false });

      for (const uid of uids) {
        const msg = await client.fetchOne(uid, { envelope: true, source: true });
        if (!msg) continue;

        const parsed = await simpleParser(msg.source);

        const emailData = {
          from: parsed.from?.text || '',
          to: parsed.to?.text || '',
          subject: parsed.subject || '',
          date: parsed.date?.toISOString() || '',
          body: (parsed.text || '').substring(0, 5000),
          messageId: parsed.messageId || '',
        };

        await client.messageFlagsAdd(uid, ['\\Seen']);
        onEmail(emailData);
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } finally {
    try { client.close(); } catch {}
  }
};

const startEmailListener = async (workflowId, credentialId, folder, userId, onEmail) => {
  if (listeners.has(workflowId)) {
    await stopEmailListener(workflowId);
  }

  const cred = await credentialService.getDecrypted(userId, credentialId);
  const imapConfig = buildImapConfig(cred);
  const mailFolder = folder || 'INBOX';
  let running = true;

  const poll = async () => {
    if (!running) return;
    try {
      await pollOnce(imapConfig, mailFolder, onEmail);
    } catch (err) {
      logger.error(`IMAP poll error for workflow ${workflowId}: ${err.message}`);
    }
    if (running) {
      const timer = setTimeout(poll, 30000);
      const entry = listeners.get(workflowId);
      if (entry) entry.timer = timer;
    }
  };

  listeners.set(workflowId, { workflowId, running: true, userId, startedAt: new Date() });
  logger.info(`Email listener started for workflow ${workflowId} on ${mailFolder}`);

  poll();
};

const stopEmailListener = async (workflowId) => {
  const entry = listeners.get(workflowId);
  if (!entry) return;

  entry.running = false;
  if (entry.timer) clearTimeout(entry.timer);
  listeners.delete(workflowId);
  logger.info(`Stopped email listener for workflow ${workflowId}`);
};

const getActiveListeners = () => {
  return Array.from(listeners.values()).map(({ workflowId, startedAt }) => ({
    workflowId, startedAt,
  }));
};

const stopAll = async () => {
  for (const [id] of listeners) {
    await stopEmailListener(id);
  }
  logger.info('All email listeners stopped');
};

module.exports = { startEmailListener, stopEmailListener, getActiveListeners, stopAll };
