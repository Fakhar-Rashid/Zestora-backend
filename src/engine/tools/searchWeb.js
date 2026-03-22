const { registerTool } = require('./toolRegistry');

registerTool('searchWeb', {
  name: 'searchWeb',
  description: 'Search the web for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
    },
    required: ['query'],
  },
  execute: async () => ({
    results: 'Web search not configured. Add a search API key.',
  }),
});
