/**
 * WhatsApp Client
 * Initializes the whatsapp-web.js client with LocalAuth for session persistence.
 * Handles all WhatsApp events: QR, ready, authenticated, auth_failure, disconnected, message.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./messageHandler');
const logger = require('../utils/logger');

/**
 * Creates and configures the WhatsApp client instance
 * @returns {Client} Configured WhatsApp client
 */
const createClient = () => {
  // Initialize client with LocalAuth for session persistence across restarts
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
      ],
    },
  });

  // --- Event Handlers ---

  /**
   * QR Code Event
   * Displays QR code in the terminal for authentication
   */
  client.on('qr', (qr) => {
    logger.connection('QR Code received. Scan it with your WhatsApp app:');
    console.log(''); // Empty line for spacing
    qrcode.generate(qr, { small: true });
    console.log(''); // Empty line for spacing
    logger.info('Open WhatsApp > Settings > Linked Devices > Link a Device');
  });

  /**
   * Ready Event
   * Fired when the client is fully initialized and ready to send/receive messages
   */
  client.on('ready', () => {
    logger.connection('✅ WhatsApp client is ready!');
    logger.info('Bot is now listening for incoming messages...');
  });

  /**
   * Authenticated Event
   * Fired when authentication is successful
   */
  client.on('authenticated', () => {
    logger.connection('✅ Authentication successful!');
  });

  /**
   * Authentication Failure Event
   * Fired when authentication fails
   */
  client.on('auth_failure', (msg) => {
    logger.error('❌ Authentication failed!', new Error(msg));
    logger.warn('Please delete the .wwebjs_auth folder and try again.');
  });

  /**
   * Disconnected Event
   * Fired when the client is disconnected from WhatsApp
   */
  client.on('disconnected', (reason) => {
    logger.connection(`⚠️ Client disconnected: ${reason}`);
    logger.info('Attempting to reconnect...');

    // Attempt to re-initialize the client
    client.initialize().catch((err) => {
      logger.error('Failed to reconnect', err);
    });
  });

  /**
   * Message Event
   * Fired when a new message is received
   * Ignores messages from the bot itself and group messages
   */
  client.on('message', async (msg) => {
    try {
      // Ignore messages sent by the bot itself
      if (msg.fromMe) return;

      // Ignore group messages (only respond to direct/private chats)
      if (msg.from.includes('@g.us')) return;

      // Ignore status broadcasts
      if (msg.from === 'status@broadcast') return;

      // Log incoming message
      logger.incoming(msg.from, msg.body);

      // Process the message and get a response
      const response = await handleMessage(msg.body);

      // Send the response back to the user
      await msg.reply(response);

      // Log outgoing reply
      logger.outgoing(msg.from, response);
    } catch (error) {
      logger.error(`Error processing message from ${msg.from}`, error);

      // Send a friendly error message to the user
      try {
        await msg.reply(
          '❌ Sorry, I encountered an error processing your message. Please try again later.'
        );
      } catch (replyError) {
        logger.error('Failed to send error reply', replyError);
      }
    }
  });

  return client;
};

/**
 * Initializes the WhatsApp client and starts listening
 * @returns {Promise<Client>} The initialized client
 */
const initializeClient = async () => {
  const client = createClient();

  logger.connection('Initializing WhatsApp client...');
  await client.initialize();

  return client;
};

module.exports = { initializeClient };
