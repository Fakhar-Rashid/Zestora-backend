const { registerTool } = require('./toolRegistry');

registerTool('httpRequest', {
  name: 'httpRequest',
  description: 'Make an HTTP request to a given URL',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to request' },
      method: { type: 'string', description: 'HTTP method', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      headers: { type: 'string', description: 'Request headers as a JSON string, e.g. {"Authorization":"Bearer token"}' },
      body: { type: 'string', description: 'Request body (JSON string)' },
    },
    required: ['url'],
  },
  execute: async ({ url, method = 'GET', headers, body }) => {
    let parsedHeaders = {};
    if (headers) {
      try {
        parsedHeaders = typeof headers === 'object' ? headers : JSON.parse(headers);
      } catch {
        parsedHeaders = {};
      }
    }
    const options = { method, headers: parsedHeaders };
    if (body && method !== 'GET') {
      options.body = body;
      if (!parsedHeaders['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
    }
    const response = await fetch(url, options);
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    return { status: response.status, data };
  },
});
