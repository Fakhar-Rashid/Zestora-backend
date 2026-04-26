const BaseNode = require('../baseNode');

class WhatsAppReceive extends BaseNode {
  static getMeta() {
    return {
      label: 'WhatsApp Trigger',
      category: 'triggers',
      icon: 'message-circle',
      color: '#25D366',
      description: 'Trigger workflow when a message arrives on your linked WhatsApp account',
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
          label: 'WhatsApp Account',
          required: true,
        },
      ],
    };
  }

  async execute(inputData) {
    const data = inputData || {};
    return {
      from: data.from || null,
      messageBody: data.messageBody || null,
      messageType: data.messageType || null,
      timestamp: data.timestamp || null,
      platform: 'whatsapp',
    };
  }
}

module.exports = WhatsAppReceive;
