const { chatOpenAI, chatGemini } = require('./llmProviders');

const DEFAULTS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
};

const chat = async ({ provider, apiKey, messages, tools, model }) => {
  const resolvedModel = model || DEFAULTS[provider];

  switch (provider) {
    case 'openai':
      return chatOpenAI({ apiKey, messages, tools, model: resolvedModel });

    case 'gemini':
      return chatGemini({ apiKey, messages, model: resolvedModel });

    case 'groq':
      return chatOpenAI({
        apiKey,
        messages,
        tools,
        model: resolvedModel,
        baseURL: 'https://api.groq.com/openai/v1',
      });

    case 'deepseek':
      return chatOpenAI({
        apiKey,
        messages,
        tools,
        model: resolvedModel,
        baseURL: 'https://api.deepseek.com',
      });

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
};

module.exports = { chat };
