const prisma = require('../config/database');

const getOrCreate = async (workflowId, sessionId) => {
  let memory = await prisma.conversationMemory.findUnique({
    where: { workflowId_sessionId: { workflowId, sessionId } },
  });
  if (!memory) {
    memory = await prisma.conversationMemory.create({
      data: { workflowId, sessionId, messages: [] },
    });
  }
  return memory.messages;
};

const addMessages = async (workflowId, sessionId, newMessages) => {
  const existing = await getOrCreate(workflowId, sessionId);
  const updated = [...existing, ...newMessages];
  await prisma.conversationMemory.update({
    where: { workflowId_sessionId: { workflowId, sessionId } },
    data: { messages: updated, lastMessageAt: new Date() },
  });
  return updated;
};

const getRecent = async (workflowId, sessionId, windowSize = 20) => {
  const messages = await getOrCreate(workflowId, sessionId);
  return messages.slice(-windowSize);
};

const clear = async (workflowId, sessionId) => {
  await prisma.conversationMemory.updateMany({
    where: { workflowId, sessionId },
    data: { messages: [] },
  });
};

module.exports = { getOrCreate, addMessages, getRecent, clear };
