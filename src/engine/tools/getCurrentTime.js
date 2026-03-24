const { registerTool } = require('./toolRegistry');

registerTool('getCurrentTime', {
  name: 'getCurrentTime',
  description: 'Get the current date and time',
  parameters: { type: 'object', properties: {} },
  execute: async () => ({ currentTime: new Date().toISOString() }),
});
