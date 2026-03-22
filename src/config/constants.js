module.exports = {
  EXECUTION_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },

  STEP_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed',
    SKIPPED: 'skipped',
  },

  TRIGGER_TYPE: {
    MANUAL: 'manual',
    WEBHOOK: 'webhook',
    CRON: 'cron',
  },

  CREDENTIAL_TYPE: {
    API_KEY: 'api_key',
    OAUTH2: 'oauth2',
    BASIC_AUTH: 'basic_auth',
    BEARER_TOKEN: 'bearer_token',
  },

  SERVICE: {
    YOUTUBE: 'youtube',
    WHATSAPP: 'whatsapp',
    TELEGRAM: 'telegram',
    OPENAI: 'openai',
    GEMINI: 'gemini',
    GROQ: 'groq',
    DEEPSEEK: 'deepseek',
    GOOGLE_SHEETS: 'google_sheets',
    GOOGLE_DOCS: 'google_docs',
    SMTP: 'smtp',
    IMAP: 'imap',
    SLACK: 'slack',
  },

  NODE_CATEGORY: {
    TRIGGERS: 'triggers',
    ACTIONS: 'actions',
    AI: 'ai',
    DATA: 'data',
    LOGIC: 'logic',
    OUTPUT: 'output',
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  AI_MAX_TOOL_ROUNDS: 5,
  AI_DEFAULT_MEMORY_WINDOW: 20,
};
