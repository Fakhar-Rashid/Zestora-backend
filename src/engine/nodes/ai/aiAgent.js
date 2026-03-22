const { v4: uuidv4 } = require('uuid');
const BaseNode = require('../baseNode');
const llmService = require('../../../services/llmService');
const conversationMemoryService = require('../../../services/conversationMemoryService');
const { getTool, getToolDefinitions } = require('../../tools/toolRegistry');

const MAX_TOOL_ROUNDS = 5;

const executeToolCalls = async (toolCalls) => {
  const results = [];
  for (const call of toolCalls) {
    const tool = getTool(call.name);
    if (!tool) {
      results.push({ name: call.name, result: { error: `Tool ${call.name} not found` } });
      continue;
    }
    const result = await tool.execute(call.arguments);
    results.push({ name: call.name, result });
  }
  return results;
};

const runToolLoop = async (messages, tools, provider, apiKey, model) => {
  let response = await llmService.chat({ provider, apiKey, messages, tools, model });
  const toolsUsed = [];
  let rounds = 0;

  while (response.toolCalls && rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const toolResults = await executeToolCalls(response.toolCalls);
    toolsUsed.push(...toolResults.map((r) => r.name));

    messages.push({ role: 'assistant', content: response.content || '', toolCalls: response.toolCalls });
    for (const tr of toolResults) {
      messages.push({ role: 'tool', content: JSON.stringify(tr.result), name: tr.name });
    }
    response = await llmService.chat({ provider, apiKey, messages, tools, model });
  }

  return { content: response.content, toolsUsed };
};

class AIAgent extends BaseNode {
  static getMeta() {
    return {
      label: 'AI Agent',
      category: 'ai',
      icon: 'bot',
      color: '#8b5cf6',
      description: 'Conversational AI agent with tool calling and memory',
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
        { key: 'systemPrompt', type: 'textarea', label: 'System Prompt', default: 'You are a helpful assistant.' },
        { key: 'memoryEnabled', type: 'checkbox', label: 'Enable Memory', default: true },
        { key: 'memoryWindow', type: 'number', label: 'Memory Window', default: 20 },
        { key: 'enableTools', type: 'checkbox', label: 'Enable Tools', default: true },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, provider, model, systemPrompt, memoryEnabled = true, memoryWindow = 20, enableTools = true } = this.config;
    const credential = await this.context.credentialService.getDecrypted(this.context.userId, credentialId);
    const apiKey = credential.apiKey || credential.accessToken;
    const sessionId = inputData.from || inputData.sessionId || uuidv4();

    const messages = [{ role: 'system', content: systemPrompt || 'You are a helpful assistant.' }];

    if (memoryEnabled) {
      const recentMessages = await conversationMemoryService.getRecent(this.context.workflowId, sessionId, memoryWindow);
      messages.push(...recentMessages);
    }

    const userContent = inputData.messageBody || inputData.message || JSON.stringify(inputData);
    messages.push({ role: 'user', content: userContent });

    const tools = enableTools ? getToolDefinitions() : [];
    const { content, toolsUsed } = enableTools && tools.length
      ? await runToolLoop(messages, tools, provider, apiKey, model)
      : { content: (await llmService.chat({ provider, apiKey, messages, model })).content, toolsUsed: [] };

    if (memoryEnabled) {
      await conversationMemoryService.addMessages(this.context.workflowId, sessionId, [
        { role: 'user', content: userContent },
        { role: 'assistant', content },
      ]);
    }

    return { responseMessage: content, sessionId, platform: inputData.platform, from: inputData.from, toolsUsed };
  }
}

module.exports = AIAgent;
