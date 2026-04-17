/**
 * AI Engine
 * Simulates AI behavior using a system prompt and rule-based logic.
 * Checks the knowledge base first, then falls back to smart pattern matching.
 */

const { findAnswer } = require('./knowledgeBase');
const logger = require('../utils/logger');

// System prompt defining the bot's personality and behavior
const SYSTEM_PROMPT =
  'You are a helpful, professional assistant. Answer clearly, concisely, and politely. If the question is unclear, ask for clarification.';

/**
 * Detects if a message is a greeting
 * @param {string} message - Normalized user message
 * @returns {boolean}
 */
const isGreeting = (message) => {
  const greetings = [
    'hi',
    'hello',
    'hey',
    'hola',
    'good morning',
    'good afternoon',
    'good evening',
    'greetings',
    'sup',
    'what\'s up',
    'howdy',
  ];
  return greetings.some((g) => message.includes(g));
};

/**
 * Detects if a message is a question
 * @param {string} message - Normalized user message
 * @returns {boolean}
 */
const isQuestion = (message) => {
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'do', 'does', 'is', 'are', 'will', 'could', 'would', 'should'];
  const startsWithQuestion = questionWords.some((word) => message.startsWith(word));
  const endsWithQuestionMark = message.endsWith('?');
  return startsWithQuestion || endsWithQuestionMark;
};

/**
 * Extracts the main topic from the user's message for smart fallback replies
 * @param {string} message - Normalized user message
 * @returns {string} Extracted topic
 */
const extractTopic = (message) => {
  // Remove common filler words to isolate the topic
  const stopWords = [
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'the', 'a', 'an',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'can', 'may', 'might',
    'about', 'with', 'from', 'for', 'to', 'in', 'on', 'at',
    'what', 'how', 'why', 'when', 'where', 'who', 'which',
    'tell', 'know', 'want', 'need', 'like', 'please',
    'this', 'that', 'it', 'of', 'and', 'or', 'not', 'no', 'yes',
  ];

  const words = message.split(/\s+/).filter((word) => !stopWords.includes(word) && word.length > 1);

  return words.length > 0 ? words.join(' ') : 'your inquiry';
};

/**
 * Generates a response to the user's message.
 * Priority: Knowledge Base → Greeting → Question → Smart Fallback
 *
 * @param {string} userMessage - The raw user message
 * @returns {Promise<string>} The generated response
 */
const generateResponse = async (userMessage) => {
  // Normalize input
  const normalized = userMessage.toLowerCase().trim();

  // 1. Check knowledge base first
  const kbAnswer = findAnswer(normalized);
  if (kbAnswer) {
    logger.info('Response source: Knowledge Base');
    return kbAnswer;
  }

  // 2. Greeting detection
  if (isGreeting(normalized)) {
    logger.info('Response source: Greeting detection');
    return '👋 Hello there! How can I assist you today? Feel free to ask me anything or type *!help* to see what I can do.';
  }

  // 3. Question detection — provide a helpful, contextual response
  if (isQuestion(normalized)) {
    const topic = extractTopic(normalized);
    logger.info(`Response source: Question detection (topic: "${topic}")`);
    return `🤔 That's a great question about *${topic}*. While I may not have a specific answer for that right now, I'd recommend reaching out to our support team for detailed assistance. You can also type *!help* to see what I can help with.`;
  }

  // 4. Smart fallback — acknowledge the user's input intelligently
  const topic = extractTopic(normalized);
  logger.info(`Response source: Smart fallback (topic: "${topic}")`);
  return `📝 I understand you're asking about *${topic}*. Let me help you with that.\n\nI don't have specific information on this topic in my database yet, but I'd love to assist! Could you provide more details or rephrase your question? You can also type *!help* for a list of things I can assist with.`;
};

module.exports = { generateResponse, SYSTEM_PROMPT };
