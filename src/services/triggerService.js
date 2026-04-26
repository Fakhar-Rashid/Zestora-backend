const { v4: uuidv4 } = require('uuid');

const prisma = require('../config/database');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { findTriggerNode } = require('../engine/graphUtils');

const lazyRequire = (mod) => {
  try { return require(mod); } catch { return null; }
};

const getRegistryType = (node) =>
  node.data?.registryType || node.data?.nodeType?.type || node.type || '';

const activate = async (userId, workflowId) => {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new AppError('Workflow not found', 404);
  if (workflow.userId !== userId) throw new AppError('Not authorized', 403);

  const version = await prisma.workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { version: 'desc' },
  });
  if (!version) throw new AppError('No version found for workflow', 400);

  const nodes = typeof version.nodesJson === 'string' ? JSON.parse(version.nodesJson) : version.nodesJson;
  const triggerNode = findTriggerNode(nodes);
  if (!triggerNode) throw new AppError('No trigger node found in workflow', 400);

  const webhookPath = uuidv4();

  await prisma.webhookRegistration.create({
    data: { workflowId, path: webhookPath, isActive: true },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { isActive: true, webhookPath },
  });

  const actualType = getRegistryType(triggerNode);

  if (actualType.startsWith('schedule-trigger')) {
    const cronExpression = triggerNode.data?.cronExpression || '* * * * *';
    const scheduler = lazyRequire('./schedulerService');
    if (scheduler) scheduler.schedule(workflowId, cronExpression, userId);
  }

  if (actualType.startsWith('email-receive')) {
    const config = triggerNode.data?.config || triggerNode.data || {};
    const { credentialId, folder = 'INBOX' } = config;
    if (credentialId) {
      const listener = lazyRequire('./listenerManager');
      const engine = lazyRequire('../engine/workflowEngine');
      if (listener && engine) {
        const onEmail = (emailData) => {
          logger.info(`Email received for workflow ${workflowId}: ${emailData.subject}`);
          engine.executeWorkflow(workflowId, emailData, 'email', userId)
            .catch((err) => logger.error(`Email trigger execution error: ${err.message}`));
        };
        listener.startEmailListener(workflowId, credentialId, folder, userId, onEmail);
      }
    } else {
      logger.warn(`Email trigger has no credential configured for workflow ${workflowId}`);
    }
  }

  if (actualType.startsWith('whatsapp-receive')) {
    const config = triggerNode.data?.config || triggerNode.data || {};
    const { credentialId } = config;
    if (credentialId) {
      const wam = lazyRequire('./whatsappClientManager');
      const engine = lazyRequire('../engine/workflowEngine');
      if (wam && engine) {
        const onMessage = (data) => {
          logger.info(`[WhatsApp] message for workflow ${workflowId} from ${data.from}`);
          engine.executeWorkflow(workflowId, data, 'whatsapp', userId)
            .catch((err) => logger.error(`WhatsApp trigger execution error: ${err.message}`));
        };
        await wam.registerWorkflow(credentialId, workflowId, onMessage);
      }
    } else {
      logger.warn(`WhatsApp trigger has no credential configured for workflow ${workflowId}`);
    }
  }

  if (actualType.startsWith('telegram-receive')) {
    const config = triggerNode.data?.config || triggerNode.data || {};
    const { credentialId } = config;
    let botToken = null;

    if (credentialId) {
      try {
        const credentialService = lazyRequire('./credentialService');
        const credential = await credentialService.getDecrypted(userId, credentialId);
        botToken = credential?.botToken;
      } catch (err) {
        logger.error(`[TelegramBot] Failed to decrypt credential for workflow ${workflowId}: ${err.message}`);
      }
    }

    if (!botToken) {
      const env = lazyRequire('./config/env');
      botToken = env.telegramBotToken;
      if (botToken) {
        logger.info(`[TelegramBot] Falling back to .env TELEGRAM_BOT_TOKEN for workflow ${workflowId}`);
      }
    }

    if (botToken) {
      const telegramBotService = lazyRequire('./telegramBotService');
      if (telegramBotService) {
        await telegramBotService.startBot(workflowId, botToken, userId);
      }
    } else {
      logger.warn(`[TelegramBot] No botToken found (neither in credential nor .env) for workflow ${workflowId}`);
    }
  }

  logger.info(`Workflow ${workflowId} activated with trigger: ${actualType}`);
  return { webhookUrl: `/api/v1/webhook/${webhookPath}`, triggerType: actualType };
};

const deactivate = async (userId, workflowId) => {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new AppError('Workflow not found', 404);
  if (workflow.userId !== userId) throw new AppError('Not authorized', 403);

  await prisma.webhookRegistration.updateMany({
    where: { workflowId, isActive: true },
    data: { isActive: false },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { isActive: false },
  });

  const scheduler = lazyRequire('./schedulerService');
  if (scheduler) scheduler.unschedule(workflowId);

  const listener = lazyRequire('./listenerManager');
  if (listener) listener.stopEmailListener(workflowId);

  const telegramBotService = lazyRequire('./telegramBotService');
  if (telegramBotService) telegramBotService.stopBot(workflowId);

  const wam = lazyRequire('./whatsappClientManager');
  if (wam) {
    const version = await prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: { version: 'desc' },
    });
    if (version) {
      const nodes = typeof version.nodesJson === 'string' ? JSON.parse(version.nodesJson) : version.nodesJson;
      const trigger = findTriggerNode(nodes);
      const triggerType = trigger ? getRegistryType(trigger) : '';
      if (triggerType.startsWith('whatsapp-receive')) {
        const credentialId = trigger?.data?.config?.credentialId || trigger?.data?.credentialId;
        if (credentialId) await wam.unregisterWorkflow(credentialId, workflowId);
      }
    }
  }

  logger.info(`Workflow ${workflowId} deactivated`);
};

const handleWebhook = async (path, body, headers) => {
  const registration = await prisma.webhookRegistration.findFirst({
    where: { path, isActive: true },
  });
  if (!registration) throw new AppError('Webhook not found', 404);

  const workflow = await prisma.workflow.findUnique({
    where: { id: registration.workflowId },
  });
  if (!workflow) throw new AppError('Workflow not found', 404);

  const version = await prisma.workflowVersion.findFirst({
    where: { workflowId: workflow.id },
    orderBy: { version: 'desc' },
  });
  const nodes = version ? JSON.parse(version.nodesJson) : [];
  const triggerNode = findTriggerNode(nodes);
  const triggerType = triggerNode ? triggerNode.type : 'webhook-trigger';

  logger.info(`Webhook received for workflow ${workflow.id}, trigger: ${triggerType}`);

  const workflowEngine = lazyRequire('./workflowEngine');
  if (!workflowEngine) throw new AppError('Workflow engine not available', 500);

  return workflowEngine.executeWorkflow(workflow.id, body, 'webhook', workflow.userId);
};

module.exports = { activate, deactivate, handleWebhook };
