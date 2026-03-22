const prisma = require('../config/database');
const { PAGINATION } = require('../config/constants');
const AppError = require('../utils/appError');

const create = async (workflowId, workflowVersion, triggerType, triggerData) => {
  return prisma.execution.create({
    data: {
      workflowId,
      workflowVersion,
      triggerType,
      triggerData: triggerData || undefined,
      status: 'pending',
    },
  });
};

const list = async (userId, { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, workflowId, status }) => {
  const where = { workflow: { userId } };
  if (workflowId) where.workflowId = workflowId;
  if (status) where.status = status;

  const [executions, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        workflow: { select: { id: true, name: true } },
      },
    }),
    prisma.execution.count({ where }),
  ]);

  return {
    executions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const getById = async (userId, executionId) => {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: {
      workflow: { select: { id: true, name: true, userId: true } },
      steps: { orderBy: { startedAt: 'asc' } },
    },
  });

  if (!execution || execution.workflow.userId !== userId) {
    throw new AppError('Execution not found', 404);
  }

  const { workflow, ...rest } = execution;
  const { userId: _uid, ...workflowData } = workflow;
  return { ...rest, workflow: workflowData };
};

const cancel = async (userId, executionId) => {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: { workflow: { select: { userId: true } } },
  });

  if (!execution || execution.workflow.userId !== userId) {
    throw new AppError('Execution not found', 404);
  }

  if (execution.status !== 'pending' && execution.status !== 'running') {
    throw new AppError(
      `Cannot cancel execution with status "${execution.status}"`,
      400,
    );
  }

  return prisma.execution.update({
    where: { id: executionId },
    data: { status: 'cancelled', completedAt: new Date() },
  });
};

const getStats = async (userId) => {
  const where = { workflow: { userId } };

  const [total, active, successful, failed] = await Promise.all([
    prisma.execution.count({ where }),
    prisma.execution.count({ where: { ...where, status: 'running' } }),
    prisma.execution.count({ where: { ...where, status: 'success' } }),
    prisma.execution.count({ where: { ...where, status: 'failed' } }),
  ]);

  return { total, active, successful, failed };
};

module.exports = { create, list, getById, cancel, getStats };
