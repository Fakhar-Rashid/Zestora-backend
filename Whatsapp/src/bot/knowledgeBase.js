/**
 * Knowledge Base
 * Contains predefined Q&A entries matched by keywords.
 * Each entry has an array of keywords and a corresponding answer.
 */

const knowledgeBase = [
  {
    keywords: ['hi', 'hello', 'hey', 'hola', 'greetings'],
    answer: '👋 Hello! Welcome! How can I help you today?',
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'later'],
    answer: '👋 Goodbye! Have a great day! Feel free to reach out anytime.',
  },
  {
    keywords: ['thanks', 'thank you', 'thx', 'appreciate'],
    answer: "You're welcome! 😊 Is there anything else I can help you with?",
  },
  {
    keywords: ['price', 'cost', 'pricing', 'rate', 'charges', 'fee'],
    answer:
      '💰 Our pricing depends on the service you need. Could you please specify what product or service you are interested in so I can provide accurate pricing?',
  },
  {
    keywords: ['hours', 'timing', 'schedule', 'open', 'available', 'availability'],
    answer:
      '🕐 Our business hours are Monday to Friday, 9:00 AM - 6:00 PM. We are also available on Saturdays from 10:00 AM - 2:00 PM.',
  },
  {
    keywords: ['location', 'address', 'where', 'office', 'branch'],
    answer:
      '📍 We are located at 123 Main Street, Business District. You can also reach us online through our website.',
  },
  {
    keywords: ['contact', 'phone', 'email', 'reach', 'call'],
    answer:
      '📞 You can reach us at:\n• Phone: +1-234-567-8900\n• Email: support@example.com\n• WhatsApp: This chat!',
  },
  {
    keywords: ['service', 'services', 'offer', 'provide', 'what do you do'],
    answer:
      '🛠️ We offer a wide range of services including:\n• Consulting\n• Technical Support\n• Product Development\n• Custom Solutions\n\nWould you like to know more about any specific service?',
  },
  {
    keywords: ['refund', 'return', 'money back', 'cancel', 'cancellation'],
    answer:
      '🔄 We have a 30-day refund policy. Please share your order details and I will guide you through the process.',
  },
  {
    keywords: ['delivery', 'shipping', 'ship', 'deliver', 'dispatch'],
    answer:
      '🚚 Standard delivery takes 3-5 business days. Express delivery is available for 1-2 business days at an additional cost.',
  },
  {
    keywords: ['payment', 'pay', 'method', 'card', 'bank', 'transfer'],
    answer:
      '💳 We accept the following payment methods:\n• Credit/Debit Cards\n• Bank Transfer\n• Digital Wallets\n• Cash on Delivery (select areas)',
  },
  {
    keywords: ['complaint', 'issue', 'problem', 'bug', 'not working'],
    answer:
      '⚠️ I am sorry to hear that you are facing an issue. Could you please describe the problem in detail? I will make sure it gets resolved as quickly as possible.',
  },
  {
    keywords: ['discount', 'offer', 'deal', 'promo', 'coupon', 'sale'],
    answer:
      '🏷️ We run special promotions from time to time! Please check our website or ask about current offers. I can also notify you when new deals are available.',
  },
  {
    keywords: ['warranty', 'guarantee'],
    answer:
      '🛡️ All our products come with a standard 1-year warranty. Extended warranty options are available at checkout.',
  },
];

/**
 * Finds the best matching answer from the knowledge base.
 * Scores each entry by how many keywords match the user message.
 *
 * @param {string} message - The normalized user message (lowercase, trimmed)
 * @returns {string|null} The best matching answer, or null if no match found
 */
const findAnswer = (message) => {
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of knowledgeBase) {
    // Count how many keywords from this entry appear in the message
    const score = entry.keywords.reduce((count, keyword) => {
      return message.includes(keyword) ? count + 1 : count;
    }, 0);

    // Update best match if this entry has a higher score
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry.answer;
    }
  }

  return bestMatch;
};

module.exports = { knowledgeBase, findAnswer };
