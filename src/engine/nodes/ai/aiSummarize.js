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

  /**
   * Extract "best" text to summarize from upstream node output.
   * The workflow engine passes upstream results as objects; this node should be resilient.
   */
  extractContent(inputData) {
    if (inputData === null || inputData === undefined) return '';
    if (typeof inputData === 'string') return inputData;

    // Common payload shapes from other nodes
    if (typeof inputData === 'object') {
      const direct =
        inputData.content ||
        inputData.text ||
        inputData.body ||
        inputData.messageBody ||
        inputData.message ||
        inputData.data;

      if (typeof direct === 'string') return direct;

      // If data is an object, try to pick the first useful string field
      if (direct && typeof direct === 'object') {
        const preferredKeys = ['content', 'text', 'body', 'messageBody', 'message', 'summary'];
        for (const k of preferredKeys) {
          if (typeof direct[k] === 'string' && direct[k].trim()) return direct[k];
        }
      }

      // Fallback: concatenate all string fields in the object (shallow)
      const stringFields = [];
      for (const [k, v] of Object.entries(inputData)) {
        if (typeof v === 'string' && v.trim()) stringFields.push(v.trim());
        // Sometimes nodes pass nested objects under `data`
        if (!stringFields.length && v && typeof v === 'object') {
          for (const [_, v2] of Object.entries(v)) {
            if (typeof v2 === 'string' && v2.trim()) stringFields.push(v2.trim());
          }
        }
      }
      if (stringFields.length) return stringFields.join('\n');
    }

    // Last resort: stringify
    try {
      return JSON.stringify(inputData);
    } catch {
      return String(inputData);
    }
  }

  async execute(inputData) {
    const { credentialId, provider, model, prompt } = this.config;

    if (!credentialId) {
      throw new Error('AI Summarize has no credential configured. Open node settings and select an AI credential.');
    }
    if (!provider) {
      throw new Error('AI Summarize has no provider selected. Open node settings and choose a provider (e.g. groq, openai).');
    }

    const credential = await this.context.credentialService.getDecrypted(
      this.context.userId,
      credentialId,
    );
    const apiKey = credential.apiKey || credential.accessToken;
    if (!apiKey) {
      throw new Error('Credential has no API key. Please update the credential with a valid API key.');
    }

    const systemPrompt = prompt || 'Summarize the following content concisely:';
    const contentToSummarize = this.extractContent(inputData);
    if (!contentToSummarize.trim()) {
      throw new Error('AI Summarize: nothing to summarize. Connect a node that provides `content`/`text` or similar fields.');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contentToSummarize },
    ];

    const response = await llmService.chat({ provider, apiKey, messages, model });
    const summary = response.content || '';

    // Provide multiple compatible keys so downstream nodes (especially `text-output`) display correctly.
    return {
      summary,
      responseMessage: summary,
      content: summary,
      text: summary,
      displayText: summary,
      originalData: inputData,
    };
  }
}

module.exports = AISummarize;
