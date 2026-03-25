const logger = require('../utils/logger');

const getWorkflowEngine = () => {
  try {
    return require('../engine/workflowEngine');
  } catch {
    return null;
  }
};

const activeBots = new Map();

const startBot = async (workflowId, botToken, userId) => {
  if (activeBots.has(workflowId)) {
    logger.info(`[TelegramBot] Bot already running for workflow ${workflowId}`);
    return activeBots.get(workflowId);
  }

  const botConfig = {
    token: botToken,
    workflowId,
    userId,
    isRunning: true,
    lastUpdateId: 0,
    botUserInfo: null,
  };

  try {
    // Test connection
    const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const getMeData = await getMeRes.json();
    if (!getMeRes.ok || !getMeData.ok) {
      throw new Error(`Telegram API Error: ${getMeData.description || 'Unknown error'}`);
    }
    botConfig.botUserInfo = getMeData.result;
    logger.info(`[TelegramBot] Started polling for workflow ${workflowId} as @${getMeData.result.username}`);
  } catch (err) {
    logger.error(`[TelegramBot] Failed to authenticate token for workflow ${workflowId}: ${err.message}`);
    throw err;
  }

  activeBots.set(workflowId, botConfig);
  
  // Start polling loop
  pollUpdates(workflowId);
  return botConfig;
};

const pollUpdates = async (workflowId) => {
  const bot = activeBots.get(workflowId);
  if (!bot || !bot.isRunning) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${bot.token}/getUpdates?offset=${bot.lastUpdateId + 1}&timeout=30`, {
      method: 'GET',
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          bot.lastUpdateId = Math.max(bot.lastUpdateId, update.update_id);
          // Process message asynchronously
          processUpdate(bot, update).catch(err => 
            logger.error(`[TelegramBot] Error processing update ${update.update_id}: ${err.message}`)
          );
        }
      }
    }
  } catch (err) {
    logger.error(`[TelegramBot] Polling error for workflow ${workflowId}: ${err.message}`);
    // Wait a bit longer before next poll on error
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Schedule next poll
  if (bot.isRunning) {
    setTimeout(() => pollUpdates(workflowId), 1000);
  }
};

const processUpdate = async (bot, update) => {
  const engine = getWorkflowEngine();
  if (!engine) {
    logger.warn(`[TelegramBot] Workflow engine not available to process update for ${bot.workflowId}`);
    return;
  }

  logger.info(`[TelegramBot] Received message on workflow ${bot.workflowId} from ${update.message?.from?.first_name}`);
  logger.info(`[TelegramBot] Message Text: "${update.message?.text || update.message?.caption || 'media'}"`);


  // Send a typing action to let the user know the bot is thinking
  if (update.message?.chat?.id) {
    fetch(`https://api.telegram.org/bot${bot.token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: update.message.chat.id, action: 'typing' }),
    }).catch(() => {}); // Ignore errors
  }

  try {
    // 1. Run the workflow
    const result = await engine.executeWorkflow(
      bot.workflowId,
      update,
      'telegram-receive',
      bot.userId
    );

    // 2. Fallback: if there was NO telegram-send node, we can manually send the response back
    const steps = result?.steps || [];
    const hasTelegramSend = steps.some(s => s.nodeType === 'telegram-send');

    if (!hasTelegramSend && steps.length > 0) {
      // Find the output of the AI Agent
      const aiStep = [...steps].reverse().find(s => s.nodeType === 'ai-agent' && s.status === 'SUCCESS');
      
      if (aiStep && aiStep.outputData?.responseMessage && update.message?.chat?.id) {
        logger.info(`[TelegramBot] Native fallback sending message to chat ${update.message.chat.id}`);
        await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: update.message.chat.id,
            text: aiStep.outputData.responseMessage,
          }),
        });
      }
    }
  } catch (err) {
    logger.error(`[TelegramBot] Failed to execute workflow ${bot.workflowId}: ${err.message}`);
    // Send error message to user
    if (update.message?.chat?.id) {
      await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: 'Sorry, I encountered an error processing your request.',
        }),
      }).catch(() => {});
    }
  }
};

const stopBot = (workflowId) => {
  const bot = activeBots.get(workflowId);
  if (bot) {
    bot.isRunning = false;
    activeBots.delete(workflowId);
    logger.info(`[TelegramBot] Stopped polling for workflow ${workflowId}`);
    return true;
  }
  return false;
};

const stopAll = () => {
  for (const [workflowId, bot] of activeBots.entries()) {
    bot.isRunning = false;
  }
  activeBots.clear();
  logger.info('[TelegramBot] All bots stopped');
};

module.exports = {
  startBot,
  stopBot,
  stopAll,
};
