const BaseNode = require('../baseNode');
const llmService = require('../../../services/llmService');

const SYSTEM_PROMPT = `Analyze the sentiment of the following text. Return your response as valid JSON with this exact format:
{"sentiment": "positive|negative|neutral|mixed", "score": <number between -1 and 1>, "explanation": "<brief explanation>"}
Only return the JSON, no additional text.`;

class SentimentAnalysis extends BaseNode {
  static getMeta() {
    return {
      label: 'Sentiment Analysis',
      category: 'ai',
      icon: 'smile',
      color: '#8b5cf6',
      description: 'Analyze text sentiment using AI',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'credentialId', type: 'credential', service: ['openai', 'gemini', 'groq', 'deepseek'], label: 'AI Credential', required: true },
        { key: 'provider', type: 'select', label: 'Provider', options: ['openai', 'gemini', 'groq', 'deepseek'], required: true },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, provider } = this.config;
    const credential = await this.context.credentialService.getDecrypted(this.context.userId, credentialId);
    const apiKey = credential.apiKey || credential.accessToken;
    const text = inputData.messageBody || inputData.text || inputData.content || JSON.stringify(inputData);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ];

    const response = await llmService.chat({ provider, apiKey, messages });

    let result;
    try {
      result = JSON.parse(response.content);
    } catch {
      result = { sentiment: 'unknown', score: 0, explanation: response.content };
    }

    return { ...result, originalText: text };
  }
}

module.exports = SentimentAnalysis;
