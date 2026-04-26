const BaseNode = require('../baseNode');
const { resolveTemplate } = require('../utils/resolveTemplate');
const whatsappClientManager = require('../../../services/whatsappClientManager');

class WhatsAppSend extends BaseNode {
  static getMeta() {
    return {
      label: 'WhatsApp Send',
      category: 'actions',
      icon: 'message-circle',
      color: '#25D366',
      description: 'Send a WhatsApp message via your linked WhatsApp account',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'credentialId',
          type: 'credential',
          service: 'whatsapp',
          label: 'WhatsApp Account',
          required: true,
        },
        {
          key: 'to',
          type: 'string',
          label: 'Recipient Phone Number',
          placeholder: 'Leave blank to reply to incoming sender',
          description: 'Format: 923001234567 (no +). Leave blank to reply to {{from}}.',
        },
        {
          key: 'messageBody',
          type: 'textarea',
          label: 'Message Text',
          required: true,
          variables: [
            { name: 'from', hint: 'Sender phone number' },
            { name: 'to', hint: 'Recipient' },
            { name: 'messageBody', hint: 'Original message body' },
            { name: 'subject', hint: 'Email subject' },
            { name: 'body', hint: 'Raw body' },
            { name: 'summary', hint: 'AI summary (if connected)' },
            { name: 'responseMessage', hint: 'AI agent response' },
            { name: 'date', hint: 'Message date' },
          ],
        },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, to, messageBody } = this.config;

    if (!credentialId) {
      throw new Error('WhatsApp Send has no credential configured. Connect a WhatsApp account in Settings and select it here.');
    }

    const resolvedTo = to
      ? resolveTemplate(to, inputData)
      : inputData.from || null;

    if (!resolvedTo) {
      throw new Error('Recipient phone number is required. Set "to" in config or ensure inputData contains "from".');
    }

    const resolvedMessage = resolveTemplate(messageBody, inputData);
    if (!resolvedMessage || !resolvedMessage.trim()) {
      throw new Error('Message body is empty after template resolution.');
    }

    return whatsappClientManager.sendMessage(credentialId, resolvedTo, resolvedMessage);
  }
}

module.exports = WhatsAppSend;
