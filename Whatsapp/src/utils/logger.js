/**
 * Logger Utility
 * Provides colored, timestamped console logging for the chatbot.
 */

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

/**
 * Returns a formatted timestamp string
 * @returns {string} ISO timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Logs an informational message (green)
 * @param {string} message - The message to log
 */
const info = (message) => {
  console.log(
    `${COLORS.green}[INFO]${COLORS.reset} ${COLORS.bright}${getTimestamp()}${COLORS.reset} — ${message}`
  );
};

/**
 * Logs a warning message (yellow)
 * @param {string} message - The message to log
 */
const warn = (message) => {
  console.log(
    `${COLORS.yellow}[WARN]${COLORS.reset} ${COLORS.bright}${getTimestamp()}${COLORS.reset} — ${message}`
  );
};

/**
 * Logs an error message (red)
 * @param {string} message - The message to log
 * @param {Error} [error] - Optional error object for stack trace
 */
const error = (message, error = null) => {
  console.log(
    `${COLORS.red}[ERROR]${COLORS.reset} ${COLORS.bright}${getTimestamp()}${COLORS.reset} — ${message}`
  );
  if (error) {
    console.error(error);
  }
};

/**
 * Logs an incoming message (cyan)
 * @param {string} from - Sender identifier
 * @param {string} body - Message body
 */
const incoming = (from, body) => {
  console.log(
    `${COLORS.cyan}[MSG IN]${COLORS.reset} ${COLORS.bright}${getTimestamp()}${COLORS.reset} — From: ${from} | "${body}"`
  );
};

/**
 * Logs an outgoing reply (magenta)
 * @param {string} to - Recipient identifier
 * @param {string} body - Reply body
 */
const outgoing = (to, body) => {
  console.log(
    `${COLORS.magenta}[MSG OUT]${COLORS.reset} ${COLORS.bright}${getTimestamp()}${COLORS.reset} — To: ${to} | "${body}"`
  );
};

/**
 * Logs connection status changes (blue)
 * @param {string} status - The connection status
 */
const connection = (status) => {
  console.log(
    `${COLORS.blue}[CONNECTION]${COLORS.reset} ${COLORS.bright}${getTimestamp()}${COLORS.reset} — ${status}`
  );
};

module.exports = {
  info,
  warn,
  error,
  incoming,
  outgoing,
  connection,
};
