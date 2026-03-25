const prisma = require('../config/database');
const { EXECUTION_STATUS, STEP_STATUS } = require('../config/constants');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { buildAdjacencyList, topologicalSort, findTriggerNode, getUpstreamNodeIds } = require('./graphUtils');
const { getNode } = require('./nodes/nodeRegistry');
const credentialService = require('../services/credentialService');

const updateStep = (stepId, data) =>
  prisma.executionStep.update({ where: { id: stepId }, data });

const executeNode = async (handler, inputData, step) => {
  const startTime = Date.now();
  try {
    const result = await handler.execute(inputData);
    await updateStep(step.id, {
      status: STEP_STATUS.SUCCESS, outputData: result,
      completedAt: new Date(), durationMs: Date.now() - startTime,
    });
    return { success: true, result };
  } catch (error) {
    await updateStep(step.id, {
      status: STEP_STATUS.FAILED, errorMessage: error.message,
      completedAt: new Date(), durationMs: Date.now() - startTime,
    });
    return { success: false, error };
  }
};

const executeWorkflow = async (workflowId, triggerData, triggerType, userId) => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  if (!workflow) throw new AppError('Workflow not found', 404);

  const version = workflow.versions[0];
  if (!version) throw new AppError('No workflow version found', 404);

  const nodes = typeof version.nodesJson === 'string' ? JSON.parse(version.nodesJson) : version.nodesJson;
  const edges = typeof version.edgesJson === 'string' ? JSON.parse(version.edgesJson) : version.edgesJson;

  const execution = await prisma.execution.create({
    data: {
      workflowId, workflowVersion: version.version,
      status: EXECUTION_STATUS.RUNNING, triggerType, triggerData, startedAt: new Date(),
    },
  });
  logger.info(`Execution ${execution.id} started for workflow ${workflowId}`);

  const { reverseAdj, nodeMap } = buildAdjacencyList(nodes, edges);
  const sortedIds = topologicalSort(nodes, edges);
  const dataStore = new Map();
  const triggerNode = findTriggerNode(nodes);

  if (!triggerNode) {
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: EXECUTION_STATUS.FAILED, completedAt: new Date(),
        errorMessage: 'Workflow must start with a trigger node (e.g. Manual Trigger)',
      },
    });
    throw new AppError('Workflow must start with a trigger node (e.g. Manual Trigger)', 400);
  }

  const context = { executionId: execution.id, workflowId, userId, credentialService, logger };
  let executionFailed = false;

  for (const nodeId of sortedIds) {
    const node = nodeMap.get(nodeId);
    const nodeType = node.data?.registryType || node.data?.nodeType?.type || node.type;

    const step = await prisma.executionStep.create({
      data: {
        executionId: execution.id, nodeId: node.id, nodeType,
        status: STEP_STATUS.RUNNING, startedAt: new Date(),
      },
    });

    let inputData = {};
    
    if (triggerNode && node.id === triggerNode.id) {
      // For the first node, its input is the raw trigger data
      inputData = triggerData;
    } else {
      const upstreamIds = getUpstreamNodeIds(nodeId, reverseAdj);
      for (const uid of upstreamIds) {
        if (dataStore.has(uid)) Object.assign(inputData, dataStore.get(uid));
      }
    }
    
    await updateStep(step.id, { inputData: triggerNode && node.id === triggerNode.id ? { _rawTrigger: true } : inputData });

    const HandlerClass = getNode(nodeType);
    if (!HandlerClass) {
      await updateStep(step.id, {
        status: STEP_STATUS.FAILED, completedAt: new Date(),
        errorMessage: `No handler registered for node type: ${node.type}`,
      });
      executionFailed = true;
      break;
    }

    const nodeConfig = node.data?.config || node.data || {};
    const handler = new HandlerClass(nodeConfig, context);
    const outcome = await executeNode(handler, inputData, step);

    if (outcome.success) {
      dataStore.set(nodeId, outcome.result);
    } else if (node.data?.continueOnError) {
      dataStore.set(nodeId, { error: outcome.error.message });
      logger.warn(`Node ${nodeId} failed but continueOnError is set, skipping`);
    } else {
      executionFailed = true;
      logger.error(`Node ${nodeId} failed: ${outcome.error.message}`);
      break;
    }
  }

  const finalStatus = executionFailed ? EXECUTION_STATUS.FAILED : EXECUTION_STATUS.SUCCESS;
  const updatedExecution = await prisma.execution.update({
    where: { id: execution.id },
    data: { status: finalStatus, completedAt: new Date() },
    include: { steps: true },
  });
  logger.info(`Execution ${execution.id} completed with status: ${finalStatus}`);
  return updatedExecution;
};

module.exports = { executeWorkflow };
