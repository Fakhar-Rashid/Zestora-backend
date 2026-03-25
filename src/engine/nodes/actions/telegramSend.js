const BaseNode = require('../baseNode');
const { resolveTemplate } = require('./whatsappSend');

class TelegramSend extends BaseNode {
  static getMeta() {
    return {
      label: 'Telegram Send',
      category: 'actions',
      icon: 'send',
      color: '#0088cc',
      description: 'Send a message via a Telegram bot',
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
          service: 'telegram',
          label: 'Telegram Bot Credential',
          required: true,
        },
        {
          key: 'chatId',
          type: 'string',
          label: 'Chat ID',
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
    const { credentialId, chatId, messageBody } = this.config;

    const credential = await this.context.credentialService.getDecrypted(
      this.context.userId,
      credentialId,
    );

    const { botToken } = credential;

    const resolvedChatId = chatId
      ? resolveTemplate(chatId, inputData)
      : inputData.chatId || null;

    let resolvedMessage = resolveTemplate(messageBody, inputData);
    if (resolvedMessage.length > 4000) {
      resolvedMessage = resolvedMessage.substring(0, 4000) + '\n\n... (truncated)';
    }

    if (!resolvedChatId) {
      // Gracefully handle manual "Run" executions that do not supply a mock Telegram payload
      console.warn('[TelegramSend] No Chat ID provided. If executing manually via the Run button, this is expected.');
      return { success: false, reason: 'Chat ID is required (missing inputData.chatId). Workflow may have been manually executed without a payload.' };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: resolvedChatId,
          text: resolvedMessage,
        }),
      },
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(responseData)}`);
    }

    return {
      success: true,
      chatId: resolvedChatId,
      messageId: responseData.result?.message_id || null,
    };
  }
}

module.exports = TelegramSend;
