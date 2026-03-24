const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const formatResponse = (content, toolCalls) => ({
  content: content || '',
  toolCalls: toolCalls || null,
});

/**
 * Parse OpenAI-format tool calls, preserving the id for round-trip.
 */
const parseToolCalls = (calls) => {
  if (!calls || !calls.length) return null;
  return calls.map((c) => {
    let args = {};
    try {
      args = JSON.parse(c.function.arguments);
    } catch {
      args = { _raw: c.function.arguments };
    }
    return {
      id: c.id,
      name: c.function.name,
      arguments: args,
    };
  });
};

/**
 * Convert our internal message format to the OpenAI API format.
 * Handles: system, user, assistant (with/without tool_calls), tool messages.
 */
const toOpenAIMessages = (messages) =>
  messages.map((m) => {
    // Tool result message
    if (m.role === 'tool') {
      return {
        role: 'tool',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        tool_call_id: m.tool_call_id || m.toolCallId || 'unknown',
      };
    }
    // Assistant message that made tool calls
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length) {
      return {
        role: 'assistant',
        content: m.content || '',
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: typeof tc.arguments === 'string'
              ? tc.arguments
              : JSON.stringify(tc.arguments),
          },
        })),
      };
    }
    // Regular message (system, user, assistant without tools)
    return { role: m.role, content: m.content || '' };
  });

const chatOpenAI = async ({ apiKey, messages, tools, model, baseURL, temperature, maxTokens, responseFormat }) => {
  const client = new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
  const params = {
    model,
    messages: toOpenAIMessages(messages),
  };

  if (tools && tools.length) {
    params.tools = tools.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }

  if (temperature !== undefined && temperature !== null && temperature !== '') {
    params.temperature = Number(temperature);
  }
  if (maxTokens !== undefined && maxTokens !== null && maxTokens !== '') {
    params.max_tokens = Number(maxTokens);
  }
  if (responseFormat === 'json') {
    params.response_format = { type: 'json_object' };
  }

  try {
    const response = await client.chat.completions.create(params);
    const choice = response.choices[0];
    return formatResponse(
      choice.message.content,
      parseToolCalls(choice.message.tool_calls),
    );
  } catch (err) {
    // If the error is a 400 related to function calling, retry without tools
    if (err.status === 400 && params.tools) {
      console.warn(
        `[LLM] Function call failed for model "${model}". Retrying without tools. Error:`,
        err.message,
      );
      delete params.tools;
      const response = await client.chat.completions.create(params);
      const choice = response.choices[0];
      return formatResponse(choice.message.content, null);
    }
    throw err;
  }
};

const chatGemini = async ({ apiKey, messages, model, temperature, maxTokens }) => {
  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig = {};
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    generationConfig.temperature = Number(temperature);
  }
  if (maxTokens !== undefined && maxTokens !== null && maxTokens !== '') {
    generationConfig.maxOutputTokens = Number(maxTokens);
  }

  const genModel = genAI.getGenerativeModel({
    model,
    ...(Object.keys(generationConfig).length && { generationConfig }),
  });

  // Filter out tool messages (Gemini doesn't support tools in our implementation)
  const textMessages = messages.filter((m) => m.role !== 'tool');
  const systemMsg = textMessages.find((m) => m.role === 'system');
  const history = textMessages
    .filter((m) => m.role !== 'system')
    .slice(0, -1)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));
  const lastMsg = textMessages.filter((m) => m.role !== 'system').slice(-1)[0];
  const chat = genModel.startChat({
    history,
    ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
  });
  const result = await chat.sendMessage(lastMsg?.content || '');
  const text = result.response.text();
  return formatResponse(text, null);
};

module.exports = { chatOpenAI, chatGemini };
