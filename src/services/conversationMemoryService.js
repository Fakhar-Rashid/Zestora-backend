const prisma = require('../config/database');

const SUMMARY_THRESHOLD = 40; // Summarize when messages exceed this count

const getOrCreate = async (workflowId, sessionId) => {
  let memory = await prisma.conversationMemory.findUnique({
    where: { workflowId_sessionId: { workflowId, sessionId } },
  });
  if (!memory) {
    memory = await prisma.conversationMemory.create({
      data: { workflowId, sessionId, messages: [], metadata: {} },
    });
  }
  return memory;
};

const addMessages = async (workflowId, sessionId, newMessages) => {
  const memory = await getOrCreate(workflowId, sessionId);
  const existing = memory.messages || [];
  const updated = [...existing, ...newMessages];
  await prisma.conversationMemory.update({
    where: { workflowId_sessionId: { workflowId, sessionId } },
    data: { messages: updated, lastMessageAt: new Date() },
  });
  return updated;
};

const getRecent = async (workflowId, sessionId, windowSize = 20) => {
  const memory = await getOrCreate(workflowId, sessionId);
  const messages = memory.messages || [];
  const metadata = memory.metadata || {};

  const result = [];

  // If there's a summary from previous auto-summarization, inject it first
  if (metadata.conversationSummary) {
    result.push({
      role: 'system',
      content: `Previous conversation summary: ${metadata.conversationSummary}`,
    });
  }

  // Append the most recent messages
  result.push(...messages.slice(-windowSize));
  return result;
};

/**
 * Auto-summarize old messages using the provided LLM.
 * Keeps only the most recent `keepCount` messages and summarizes the rest.
 */
const autoSummarize = async (workflowId, sessionId, llmChatFn, keepCount = 20) => {
  const memory = await getOrCreate(workflowId, sessionId);
  const messages = memory.messages || [];

  if (messages.length < SUMMARY_THRESHOLD) return; // Not enough to summarize

  const oldMessages = messages.slice(0, -keepCount);
  const recentMessages = messages.slice(-keepCount);

  if (oldMessages.length === 0) return;

  const metadata = memory.metadata || {};
  const existingSummary = metadata.conversationSummary || '';

  // Build a summarization request
  const summaryPrompt = [
    { role: 'system', content: 'You are a summarization assistant. Summarize the following conversation into a concise paragraph, preserving key facts, decisions, user preferences, and important context. Keep it under 300 words.' },
  ];

  if (existingSummary) {
    summaryPrompt.push({
      role: 'user',
      content: `Previous summary:\n${existingSummary}\n\nNew messages to incorporate:\n${oldMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
    });
  } else {
    summaryPrompt.push({
      role: 'user',
      content: `Summarize this conversation:\n${oldMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
    });
  }

  try {
    const summaryResponse = await llmChatFn(summaryPrompt);
    const newSummary = summaryResponse.content;

    await prisma.conversationMemory.update({
      where: { workflowId_sessionId: { workflowId, sessionId } },
      data: {
        messages: recentMessages,
        metadata: { ...metadata, conversationSummary: newSummary, lastSummarizedAt: new Date().toISOString() },
        lastMessageAt: new Date(),
      },
    });
  } catch (err) {
    console.error('[ConversationMemory] Auto-summarize failed:', err.message);
    // Non-fatal — just skip summarization
  }
};

const clear = async (workflowId, sessionId) => {
  await prisma.conversationMemory.updateMany({
    where: { workflowId, sessionId },
    data: { messages: [], metadata: {} },
  });
};

module.exports = { getOrCreate, addMessages, getRecent, autoSummarize, clear };
