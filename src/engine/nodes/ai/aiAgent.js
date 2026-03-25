const { v4: uuidv4 } = require('uuid');
const BaseNode = require('../baseNode');
const llmService = require('../../../services/llmService');
const conversationMemoryService = require('../../../services/conversationMemoryService');
const knowledgeBaseService = require('../../../services/knowledgeBaseService');
const { getTool, getToolDefinitions } = require('../../tools/toolRegistry');

const MAX_TOOL_ROUNDS = 5;

/* ───────── Tool execution helpers ───────── */

const executeToolCalls = async (toolCalls) => {
  const results = [];
  for (const call of toolCalls) {
    const tool = getTool(call.name);
    if (!tool) {
      results.push({ id: call.id, name: call.name, result: { error: `Tool ${call.name} not found` } });
      continue;
    }
    try {
      const result = await tool.execute(call.arguments);
      results.push({ id: call.id, name: call.name, result });
    } catch (err) {
      results.push({ id: call.id, name: call.name, result: { error: err.message } });
    }
  }
  return results;
};

const runToolLoop = async (messages, tools, llmOpts) => {
  let response = await llmService.chat({ ...llmOpts, messages, tools });
  const toolsUsed = [];
  let rounds = 0;

  while (response.toolCalls && rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const toolResults = await executeToolCalls(response.toolCalls);
    toolsUsed.push(...toolResults.map((r) => r.name));

    // Push the assistant message with its tool_calls (preserving IDs)
    messages.push({
      role: 'assistant',
      content: response.content || '',
      toolCalls: response.toolCalls,
    });

    // Push each tool result with the matching tool_call_id
    for (const tr of toolResults) {
      messages.push({
        role: 'tool',
        content: JSON.stringify(tr.result),
        name: tr.name,
        tool_call_id: tr.id,
      });
    }

    try {
      response = await llmService.chat({ ...llmOpts, messages, tools });
    } catch (err) {
      // If the LLM fails on a tool round, return what we have so far
      console.error('[AIAgent] Tool loop LLM error:', err.message);
      const lastToolResults = toolResults.map((r) => `${r.name}: ${JSON.stringify(r.result)}`).join('\n');
      return {
        content: response.content || `Tool results:\n${lastToolResults}`,
        toolsUsed,
      };
    }
  }

  return { content: response.content, toolsUsed };
};

/* ───────── AI Agent Node ───────── */

class AIAgent extends BaseNode {
  static getMeta() {
    return {
      label: 'AI Agent',
      category: 'ai',
      icon: 'bot',
      color: '#8b5cf6',
      description: 'Conversational AI agent with tools, memory & knowledge base',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        // ── Provider & Model ──
        {
          key: 'credentialId',
          type: 'credential',
          service: ['openai', 'gemini', 'groq', 'deepseek'],
          label: 'AI Credential',
          required: true,
        },
        {
          key: 'provider',
          type: 'select',
          label: 'Provider',
          options: ['openai', 'gemini', 'groq', 'deepseek'],
          required: true,
        },
        {
          key: 'model',
          type: 'string',
          label: 'Model',
          description: 'Leave blank for default model',
          placeholder: 'e.g. gpt-4o, gemini-1.5-pro',
        },

        // ── Prompt & Personality ──
        {
          key: 'systemPrompt',
          type: 'textarea',
          label: 'System Prompt',
          default: 'You are a helpful assistant.',
          description: 'Define the AI persona, instructions, and behavior',
          rows: 5,
        },

        // ── LLM Parameters ──
        {
          key: 'temperature',
          type: 'number',
          label: 'Temperature',
          default: 0.7,
          min: 0,
          max: 2,
          step: 0.1,
          description: '0 = deterministic, 2 = very creative',
        },
        {
          key: 'maxTokens',
          type: 'number',
          label: 'Max Tokens',
          default: '',
          min: 1,
          max: 128000,
          description: 'Max response length. Leave empty for default.',
        },
        {
          key: 'responseFormat',
          type: 'select',
          label: 'Response Format',
          options: [
            { value: 'text', label: 'Text (default)' },
            { value: 'json', label: 'JSON Object' },
          ],
          default: 'text',
          description: 'Force JSON output (OpenAI/Groq/DeepSeek only)',
        },

        // ── Memory ──
        {
          key: 'memoryEnabled',
          type: 'checkbox',
          label: 'Enable Conversation Memory',
          default: true,
          description: 'Remember previous messages in the session',
        },
        {
          key: 'memoryWindow',
          type: 'number',
          label: 'Memory Window',
          default: 20,
          min: 2,
          max: 100,
          description: 'Number of recent messages to include',
        },
        {
          key: 'autoSummarize',
          type: 'checkbox',
          label: 'Auto-Summarize Memory',
          default: true,
          description: 'When memory grows large, summarize old messages automatically',
        },

        // ── Knowledge Base ──
        {
          key: 'knowledgeBase',
          type: 'knowledgebase',
          label: 'Knowledge Base',
          description: 'Add reference documents the AI can use to answer questions (RAG)',
        },

        // ── Tools ──
        {
          key: 'enableTools',
          type: 'checkbox',
          label: 'Enable Tools',
          default: true,
          description: 'Allow the AI to use tools (calculator, web search, HTTP, etc.)',
        },

        // ── Fallback ──
        {
          key: 'fallbackMessage',
          type: 'textarea',
          label: 'Fallback Message',
          default: '',
          rows: 2,
          description: 'Message to return if the AI fails to respond',
          placeholder: 'Sorry, I could not process your request. Please try again.',
        },
      ],
    };
  }

  async execute(inputData) {
    const {
      credentialId,
      provider,
      model,
      systemPrompt,
      temperature = 0.7,
      maxTokens,
      responseFormat = 'text',
      memoryEnabled = true,
      memoryWindow = 20,
      autoSummarize = true,
      enableTools = true,
      fallbackMessage = '',
    } = this.config;

    try {
      // ── 0. Validate required config ──
      if (!credentialId) {
        throw new Error('AI Agent has no credential configured. Open node settings and select an AI credential.');
      }
      if (!provider) {
        throw new Error('AI Agent has no provider selected. Open node settings and choose a provider (e.g. groq, openai).');
      }

      // ── 1. Resolve credential ──
      const credential = await this.context.credentialService.getDecrypted(
        this.context.userId,
        credentialId,
      );
      const apiKey = credential.apiKey || credential.accessToken;
      if (!apiKey) {
        throw new Error('Credential has no API key. Please update the credential with a valid API key.');
      }

      // ── 2. Session ID ──
      const sessionId = inputData.from || inputData.sessionId || uuidv4();

      // ── 3. Build system prompt with knowledge base ──
      let fullSystemPrompt = systemPrompt || 'You are a helpful assistant.';

      // Inject knowledge base context
      if (this.context.workflowId) {
        const kbContext = await knowledgeBaseService.buildKnowledgeContext(this.context.workflowId);
        if (kbContext) {
          fullSystemPrompt += kbContext;
        }
      }

      const messages = [{ role: 'system', content: fullSystemPrompt }];

      // ── 4. Load conversation memory ──
      if (memoryEnabled) {
        const recentMessages = await conversationMemoryService.getRecent(
          this.context.workflowId,
          sessionId,
          memoryWindow,
        );
        messages.push(...recentMessages);
      }

      // ── 5. Add user message ──
      const userContent =
        inputData.messageBody || inputData.message || JSON.stringify(inputData);
      messages.push({ role: 'user', content: userContent });

      // ── 6. LLM options ──
      const llmOpts = {
        provider,
        apiKey,
        model,
        temperature,
        maxTokens: maxTokens || undefined,
        responseFormat,
      };

      // ── 7. Run LLM (with or without tools) ──
      const tools = enableTools ? getToolDefinitions() : [];
      let content, toolsUsed;

      if (enableTools && tools.length) {
        ({ content, toolsUsed } = await runToolLoop(messages, tools, llmOpts));
      } else {
        const resp = await llmService.chat({ ...llmOpts, messages });
        content = resp.content;
        toolsUsed = [];
      }

      // ── 8. Save to memory ──
      if (memoryEnabled) {
        await conversationMemoryService.addMessages(this.context.workflowId, sessionId, [
          { role: 'user', content: userContent },
          { role: 'assistant', content },
        ]);

        // Auto-summarize if enabled
        if (autoSummarize) {
          const summarizeFn = async (msgs) =>
            llmService.chat({ provider, apiKey, model, messages: msgs });
          await conversationMemoryService.autoSummarize(
            this.context.workflowId,
            sessionId,
            summarizeFn,
            memoryWindow,
          );
        }
      }

      // ── 9. Return result ──
      return {
        responseMessage: content,
        sessionId,
        platform: inputData.platform,
        from: inputData.from,
        chatId: inputData.chatId,
        toolsUsed,
        memoryEnabled,
        knowledgeBaseUsed: !!this.context.workflowId,
      };
    } catch (err) {
      console.error('[AIAgent] Execution error:', err.message);

      // Return fallback message if configured
      if (fallbackMessage) {
        return {
          responseMessage: fallbackMessage,
          sessionId: inputData.from || inputData.sessionId || 'error',
          platform: inputData.platform,
          from: inputData.from,
          chatId: inputData.chatId,
          toolsUsed: [],
          error: err.message,
        };
      }

      throw err;
    }
  }
}

module.exports = AIAgent;
