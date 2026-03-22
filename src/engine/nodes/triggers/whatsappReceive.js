const BaseNode = require('../baseNode');

class WhatsAppReceive extends BaseNode {
  static getMeta() {
    return {
      label: 'WhatsApp Trigger',
      category: 'triggers',
      icon: 'message-circle',
      color: '#25D366',
      description: 'Trigger workflow when a WhatsApp message is received',
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
          service: 'whatsapp',
          label: 'WhatsApp Credential',
          required: true,
        },
      ],
    };
  }

  async execute(inputData) {
    const payload = inputData || {};

    const entry = payload.entry;
    if (!entry || !entry.length) {
      return { from: null, messageBody: null, messageType: null, timestamp: null, platform: 'whatsapp', rawPayload: payload };
    }

    const changes = entry[0].changes;
    if (!changes || !changes.length) {
      return { from: null, messageBody: null, messageType: null, timestamp: null, platform: 'whatsapp', rawPayload: payload };
    }

    const value = changes[0].value || {};
    const messages = value.messages;

    if (!messages || !messages.length) {
      return { from: null, messageBody: null, messageType: null, timestamp: null, platform: 'whatsapp', rawPayload: payload };
    }

    const message = messages[0];

    return {
      from: message.from || null,
      messageBody: message.text?.body || message.caption || null,
      messageType: message.type || null,
      timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : null,
      platform: 'whatsapp',
      rawPayload: payload,
    };
  }
}

module.exports = WhatsAppReceive;
