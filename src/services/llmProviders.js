const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const formatResponse = (content, toolCalls) => ({
  content: content || '',
  toolCalls: toolCalls || null,
});

const parseToolCalls = (calls) => {
  if (!calls || !calls.length) return null;
  return calls.map((c) => ({
    name: c.function.name,
    arguments: JSON.parse(c.function.arguments),
  }));
};

const chatOpenAI = async ({ apiKey, messages, tools, model, baseURL }) => {
  const client = new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
  const params = { model, messages };
  if (tools && tools.length) {
    params.tools = tools.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }
  const response = await client.chat.completions.create(params);
  const choice = response.choices[0];
  return formatResponse(
    choice.message.content,
    parseToolCalls(choice.message.tool_calls),
  );
};

const chatGemini = async ({ apiKey, messages, model }) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });
  const systemMsg = messages.find((m) => m.role === 'system');
  const history = messages
    .filter((m) => m.role !== 'system')
    .slice(0, -1)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  const lastMsg = messages.filter((m) => m.role !== 'system').slice(-1)[0];
  const chat = genModel.startChat({
    history,
    ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
  });
  const result = await chat.sendMessage(lastMsg?.content || '');
  const text = result.response.text();
  return formatResponse(text, null);
};

module.exports = { chatOpenAI, chatGemini };
