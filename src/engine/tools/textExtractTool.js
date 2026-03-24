const { registerTool } = require('./toolRegistry');

registerTool('extractTextFromUrl', {
  name: 'extractTextFromUrl',
  description: 'Fetch a web page and extract its text content. Useful for reading articles, documentation, or any public web page.',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The full URL to fetch and extract text from' },
      maxLength: { type: 'number', description: 'Maximum number of characters to return (default: 5000)' },
    },
    required: ['url'],
  },
  execute: async ({ url, maxLength = 5000 }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZestoraBot/1.0)',
          Accept: 'text/html,application/xhtml+xml,text/plain',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { error: `HTTP ${response.status}: ${response.statusText}`, url };
      }

      const html = await response.text();

      // Simple HTML-to-text: strip tags, decode entities, collapse whitespace
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      const truncated = text.slice(0, maxLength);
      return {
        text: truncated,
        url,
        totalLength: text.length,
        wasTruncated: text.length > maxLength,
      };
    } catch (err) {
      return { error: `Failed to fetch: ${err.message}`, url };
    }
  },
});
