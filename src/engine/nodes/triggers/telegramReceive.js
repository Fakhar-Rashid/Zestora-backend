const BaseNode = require('../baseNode');

class TelegramReceive extends BaseNode {
  static getMeta() {
    return {
      label: 'Telegram Trigger',
      category: 'triggers',
      icon: 'send',
      color: '#0088cc',
      description: 'Trigger workflow when a Telegram message is received',
      inputs: 0,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'credentialId',
          type: 'credential',
          service: 'telegram',
          label: 'Telegram Bot Credential',
          required: true,
        },
      ],
    };
  }

  async execute(inputData) {
    const update = inputData || {};
    const message = update.message || update.edited_message || {};

    const from = message.from || {};
    const chat = message.chat || {};

    return {
      from: from.id ? String(from.id) : null,
      chatId: chat.id ? String(chat.id) : null,
      messageBody: message.text || message.caption || null,
      messageType: message.text ? 'text' : (message.photo ? 'photo' : (message.document ? 'document' : 'unknown')),
      timestamp: message.date ? new Date(message.date * 1000).toISOString() : null,
      platform: 'telegram',
      firstName: from.first_name || null,
      rawPayload: update,
    };
  }
}

module.exports = TelegramReceive;
