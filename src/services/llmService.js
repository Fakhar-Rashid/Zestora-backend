const { chatOpenAI, chatGemini } = require('./llmProviders');

const DEFAULTS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
};

const chat = async ({ provider, apiKey, messages, tools, model, temperature, maxTokens, responseFormat }) => {
  const resolvedModel = model || DEFAULTS[provider];
  const opts = { apiKey, messages, tools, model: resolvedModel, temperature, maxTokens, responseFormat };

  switch (provider) {
    case 'openai':
      return chatOpenAI(opts);

    case 'gemini':
      return chatGemini(opts);

    case 'groq':
      return chatOpenAI({
        ...opts,
        baseURL: 'https://api.groq.com/openai/v1',
      });

    case 'deepseek':
      return chatOpenAI({
        ...opts,
        baseURL: 'https://api.deepseek.com',
      });

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
};

module.exports = { chat };
