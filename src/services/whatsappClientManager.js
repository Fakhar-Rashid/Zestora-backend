const path = require('path');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const logger = require('../utils/logger');

const DATA_PATH = path.resolve(__dirname, '../../data/wwebjs');

const clients = new Map();

const ensureDataPath = () => {
  if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });
};

const buildClient = (credentialId) => new Client({
  authStrategy: new LocalAuth({ clientId: credentialId, dataPath: DATA_PATH }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
    ],
  },
});

const dispatchMessage = (entry, msg) => {
  if (msg.fromMe) return;
  if (msg.from && msg.from.includes('@g.us')) return;
  if (msg.from === 'status@broadcast') return;

  const payload = {
    from: (msg.from || '').replace('@c.us', ''),
    messageBody: msg.body || '',
    messageType: msg.type || 'text',
    timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
    platform: 'whatsapp',
  };

  for (const [, callback] of entry.callbacks) {
    Promise.resolve()
      .then(() => callback(payload))
      .catch((err) => logger.error(`[WhatsApp] callback error: ${err.message}`));
  }
};

const connect = async (credentialId) => {
  ensureDataPath();

  const existing = clients.get(credentialId);
  if (existing) return existing;

  const client = buildClient(credentialId);
  const entry = {
    client,
    status: 'authenticating',
    qrDataUrl: null,
    phoneNumber: null,
    callbacks: new Map(),
  };
  clients.set(credentialId, entry);

  client.on('qr', async (qr) => {
    try {
      entry.qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 1 });
      entry.status = 'qr';
      logger.info(`[WhatsApp] QR ready for credential ${credentialId}`);
    } catch (err) {
      logger.error(`[WhatsApp] QR encode failed: ${err.message}`);
    }
  });

  client.on('authenticated', () => {
    entry.status = 'authenticating';
    entry.qrDataUrl = null;
    logger.info(`[WhatsApp] Authenticated for credential ${credentialId}`);
  });

  client.on('ready', () => {
    entry.status = 'ready';
    entry.qrDataUrl = null;
    entry.phoneNumber = client.info?.wid?.user || null;
    logger.info(`[WhatsApp] Client ready for credential ${credentialId} as ${entry.phoneNumber}`);
  });

  client.on('auth_failure', (msg) => {
    entry.status = 'failed';
    entry.qrDataUrl = null;
    logger.error(`[WhatsApp] Auth failure for ${credentialId}: ${msg}`);
  });

  client.on('disconnected', (reason) => {
    logger.warn(`[WhatsApp] Disconnected ${credentialId}: ${reason}`);
    entry.status = 'failed';
  });

  client.on('message', (msg) => dispatchMessage(entry, msg));

  client.initialize().catch((err) => {
    entry.status = 'failed';
    logger.error(`[WhatsApp] initialize failed for ${credentialId}: ${err.message}`);
  });

  return entry;
};

const getStatus = (credentialId) => {
  const entry = clients.get(credentialId);
  if (!entry) return { status: 'disconnected', qrDataUrl: null, phoneNumber: null };
  return { status: entry.status, qrDataUrl: entry.qrDataUrl, phoneNumber: entry.phoneNumber };
};

const registerWorkflow = async (credentialId, workflowId, onMessage) => {
  let entry = clients.get(credentialId);
  if (!entry) entry = await connect(credentialId);
  entry.callbacks.set(workflowId, onMessage);
  logger.info(`[WhatsApp] Registered workflow ${workflowId} for credential ${credentialId}`);
};

const unregisterWorkflow = async (credentialId, workflowId) => {
  const entry = clients.get(credentialId);
  if (!entry) return;
  entry.callbacks.delete(workflowId);
  logger.info(`[WhatsApp] Unregistered workflow ${workflowId} from credential ${credentialId}`);
};

const sendMessage = async (credentialId, to, body) => {
  const entry = clients.get(credentialId);
  if (!entry || entry.status !== 'ready') {
    throw new Error(`WhatsApp client for credential ${credentialId} is not ready (status: ${entry?.status || 'disconnected'}). Connect the credential in Settings first.`);
  }
  const digits = String(to).replace(/[^\d]/g, '');
  if (!digits) throw new Error('Recipient phone number is empty.');
  const chatId = `${digits}@c.us`;
  const result = await entry.client.sendMessage(chatId, body);
  return { success: true, to: digits, messageId: result?.id?._serialized || null };
};

const disconnect = async (credentialId) => {
  const entry = clients.get(credentialId);
  if (!entry) return;
  try { await entry.client.destroy(); } catch (err) { logger.warn(`[WhatsApp] destroy err: ${err.message}`); }
  clients.delete(credentialId);
  logger.info(`[WhatsApp] Disconnected credential ${credentialId}`);
};

const stopAll = async () => {
  for (const id of Array.from(clients.keys())) await disconnect(id);
};

module.exports = {
  connect,
  getStatus,
  registerWorkflow,
  unregisterWorkflow,
  sendMessage,
  disconnect,
  stopAll,
};
