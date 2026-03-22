const prisma = require('../config/database');
const AppError = require('../utils/appError');

const WORKFLOW_LIST_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  triggerType: true,
  currentVersion: true,
  createdAt: true,
  updatedAt: true,
};

const verifyOwnership = async (userId, workflowId) => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });
  if (!workflow || workflow.userId !== userId) {
    throw new AppError('Workflow not found', 404);
  }
  return workflow;
};

const create = async (userId, { name, description }) => {
  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name,
      description,
      versions: {
        create: { version: 1, nodesJson: [], edgesJson: [] },
      },
    },
    select: WORKFLOW_LIST_SELECT,
  });
  return workflow;
};

const list = async (userId) => {
  return prisma.workflow.findMany({
    where: { userId },
    select: WORKFLOW_LIST_SELECT,
    orderBy: { updatedAt: 'desc' },
  });
};

const getById = async (userId, workflowId) => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow || workflow.userId !== userId) {
    throw new AppError('Workflow not found', 404);
  }

  const currentVer = await prisma.workflowVersion.findUnique({
    where: {
      workflowId_version: { workflowId, version: workflow.currentVersion },
    },
  });

  return { ...workflow, versions: currentVer ? [currentVer] : [] };
};

const update = async (userId, workflowId, updates) => {
  await verifyOwnership(userId, workflowId);
  return prisma.workflow.update({
    where: { id: workflowId },
    data: updates,
    select: WORKFLOW_LIST_SELECT,
  });
};

const remove = async (userId, workflowId) => {
  await verifyOwnership(userId, workflowId);
  await prisma.workflow.delete({ where: { id: workflowId } });
};

const saveVersion = async (userId, workflowId, { nodesJson, edgesJson, viewportJson }) => {
  const workflow = await verifyOwnership(userId, workflowId);
  const nextVersion = workflow.currentVersion + 1;

  const [, version] = await prisma.$transaction([
    prisma.workflow.update({
      where: { id: workflowId },
      data: { currentVersion: nextVersion },
    }),
    prisma.workflowVersion.create({
      data: {
        workflowId,
        version: nextVersion,
        nodesJson,
        edgesJson,
        viewportJson,
      },
    }),
  ]);

  return version;
};

const listVersions = async (userId, workflowId) => {
  await verifyOwnership(userId, workflowId);
  return prisma.workflowVersion.findMany({
    where: { workflowId },
    select: { id: true, version: true, createdAt: true },
    orderBy: { version: 'desc' },
  });
};

const getVersion = async (userId, workflowId, version) => {
  await verifyOwnership(userId, workflowId);
  const record = await prisma.workflowVersion.findUnique({
    where: { workflowId_version: { workflowId, version } },
  });
  if (!record) throw new AppError('Version not found', 404);
  return record;
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  saveVersion,
  listVersions,
  getVersion,
};
