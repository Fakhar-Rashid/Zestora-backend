const BaseNode = require('../baseNode');
const llmService = require('../../../services/llmService');

class AISummarize extends BaseNode {
  static getMeta() {
    return {
      label: 'AI Summarize',
      category: 'ai',
      icon: 'file-text',
      color: '#8b5cf6',
      description: 'Summarize content using an AI model',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'credentialId', type: 'credential', service: ['openai', 'gemini', 'groq', 'deepseek'], label: 'AI Credential', required: true },
        { key: 'provider', type: 'select', label: 'Provider', options: ['openai', 'gemini', 'groq', 'deepseek'], required: true },
        { key: 'model', type: 'string', label: 'Model (optional)' },
        { key: 'prompt', type: 'textarea', label: 'Summarization Prompt', default: 'Summarize the following content concisely:' },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, provider, model, prompt } = this.config;
    const credential = await this.context.credentialService.getDecrypted(this.context.userId, credentialId);
    const apiKey = credential.apiKey || credential.accessToken;
    const systemPrompt = prompt || 'Summarize the following content concisely:';

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(inputData) },
    ];

    const response = await llmService.chat({ provider, apiKey, messages, model });

    return { summary: response.content, originalData: inputData };
  }
}

module.exports = AISummarize;
