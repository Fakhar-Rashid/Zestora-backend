const BaseNode = require('../baseNode');

/**
 * Replace {{key}} placeholders in a template string with values from data.
 */
function resolveTemplate(template, data) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

class WhatsAppSend extends BaseNode {
  static getMeta() {
    return {
      label: 'WhatsApp Send',
      category: 'actions',
      icon: 'message-circle',
      color: '#25D366',
      description: 'Send a WhatsApp message via the Cloud API',
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
          label: 'WhatsApp Credential',
          required: true,
        },
        {
          key: 'to',
          type: 'string',
          label: 'Recipient Phone Number',
        },
        {
          key: 'messageBody',
          type: 'textarea',
          label: 'Message Text',
          required: true,
        },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, to, messageBody } = this.config;

    const credential = await this.context.credentialService.getDecrypted(
      this.context.userId,
      credentialId,
    );

    const { phoneNumberId, accessToken } = credential;

    const resolvedTo = to
      ? resolveTemplate(to, inputData)
      : inputData.from || null;

    const resolvedMessage = resolveTemplate(messageBody, inputData);

    if (!resolvedTo) {
      throw new Error('Recipient phone number is required. Set "to" in config or ensure inputData contains "from".');
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: resolvedTo,
          type: 'text',
          text: { body: resolvedMessage },
        }),
      },
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`);
    }

    return {
      success: true,
      to: resolvedTo,
      messageId: responseData.messages?.[0]?.id || null,
    };
  }
}

module.exports = WhatsAppSend;
module.exports.resolveTemplate = resolveTemplate;
