const prisma = require('../config/database');

/**
 * Get all knowledge entries for a workflow.
 */
const getAll = async (workflowId) => {
  return prisma.knowledgeEntry.findMany({
    where: { workflowId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get only active knowledge entries for a workflow (used at runtime).
 */
const getActive = async (workflowId) => {
  return prisma.knowledgeEntry.findMany({
    where: { workflowId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Create a new knowledge entry.
 */
const create = async (workflowId, data) => {
  return prisma.knowledgeEntry.create({
    data: {
      workflowId,
      title: data.title,
      content: data.content,
      category: data.category || 'general',
    },
  });
};

/**
 * Update an existing knowledge entry.
 */
const update = async (id, data) => {
  return prisma.knowledgeEntry.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

/**
 * Delete a knowledge entry.
 */
const remove = async (id) => {
  return prisma.knowledgeEntry.delete({ where: { id } });
};

/**
 * Build a context string from active knowledge entries for a workflow.
 * This is injected into the system prompt for RAG-like behavior.
 */
const buildKnowledgeContext = async (workflowId) => {
  const entries = await getActive(workflowId);
  if (!entries.length) return '';

  const sections = entries.map(
    (e) => `### ${e.title} [${e.category}]\n${e.content}`
  );

  return [
    '\n\n--- KNOWLEDGE BASE ---',
    'Use the following reference information to answer user questions accurately.',
    'If the answer is found in the knowledge base, cite the relevant section.',
    'If not found, answer based on your general knowledge and state that clearly.',
    '',
    ...sections,
    '--- END KNOWLEDGE BASE ---',
  ].join('\n');
};

module.exports = { getAll, getActive, create, update, remove, buildKnowledgeContext };
