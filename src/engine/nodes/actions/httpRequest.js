const BaseNode = require('../baseNode');
const { resolveTemplate } = require('../utils/resolveTemplate');

class HttpRequest extends BaseNode {
  static getMeta() {
    return {
      label: 'HTTP Request',
      category: 'actions',
      icon: 'globe',
      color: '#3b82f6',
      description: 'Make an outbound HTTP request',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'url',
          type: 'string',
          label: 'URL',
          required: true,
        },
        {
          key: 'method',
          type: 'select',
          label: 'Method',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          default: 'GET',
        },
        {
          key: 'headers',
          type: 'textarea',
          label: 'Headers (JSON)',
        },
        {
          key: 'body',
          type: 'textarea',
          label: 'Body (JSON)',
        },
      ],
    };
  }

  async execute(inputData) {
    const { url, method = 'GET', headers: rawHeaders, body: rawBody } = this.config;

    const resolvedUrl = resolveTemplate(url, inputData);

    let parsedHeaders = {};
    if (rawHeaders) {
      const resolved = resolveTemplate(rawHeaders, inputData);
      parsedHeaders = JSON.parse(resolved);
    }

    let fetchBody;
    if (rawBody && method !== 'GET') {
      const resolved = resolveTemplate(rawBody, inputData);
      fetchBody = resolved;
      if (!parsedHeaders['Content-Type']) {
        parsedHeaders['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(resolvedUrl, {
      method,
      headers: parsedHeaders,
      body: fetchBody || undefined,
    });

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      data,
      headers: responseHeaders,
    };
  }
}

module.exports = HttpRequest;
