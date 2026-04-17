/**
 * Message Handler
 * Processes incoming WhatsApp messages.
 * Handles commands, normalizes input, and delegates to the AI engine.
 */

const { generateResponse } = require('./aiEngine');
const logger = require('../utils/logger');

// Command definitions — these override AI responses
const COMMANDS = {
  '!help': {
    description: 'Show available features',
    handler: () => {
      return [
        '📖 *Available Commands & Features*',
        '━━━━━━━━━━━━━━━━━━━━━',
        '',
        '🔹 *!help* — Show this help menu',
        '🔹 *!about* — Learn about this bot',
        '',
        '💬 *Topics I Can Help With:*',
        '• Pricing & Costs',
        '• Business Hours & Availability',
        '• Location & Address',
        '• Contact Information',
        '• Services We Offer',
        '• Payment Methods',
        '• Delivery & Shipping',
        '• Refunds & Returns',
        '• Discounts & Offers',
        '• Warranty Information',
        '• Complaints & Issues',
        '',
        '✨ Just type your question naturally and I will do my best to help!',
      ].join('\n');
    },
  },
  '!about': {
    description: 'Bot description',
    handler: () => {
      return [
        '🤖 *WhatsApp Smart Assistant*',
        '━━━━━━━━━━━━━━━━━━━━━',
        '',
        'I am an intelligent chatbot designed to assist you with quick answers to common questions.',
        '',
        '🧠 Powered by a smart knowledge base and AI-style logic, I can understand your queries and provide relevant responses.',
        '',
        '📌 Version: 1.0.0',
        '👨‍💻 Built with: whatsapp-web.js',
        '',
        'Type *!help* to see what I can do!',
      ].join('\n');
    },
  },
};

/**
 * Handles an incoming message and returns the appropriate response.
 *
 * @param {string} rawMessage - The raw message string from the user
 * @returns {Promise<string>} The response to send back
 */
const handleMessage = async (rawMessage) => {
  // Normalize input: lowercase and trim whitespace
  const message = rawMessage.toLowerCase().trim();

  // Check if the message is a command (commands take priority)
  if (COMMANDS[message]) {
    logger.info(`Command detected: ${message}`);
    return COMMANDS[message].handler();
  }

  // Delegate to AI engine for knowledge base + smart response
  const response = await generateResponse(rawMessage);
  return response;
};

module.exports = { handleMessage };
