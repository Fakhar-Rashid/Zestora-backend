const { z } = require('zod');

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['api_key', 'oauth2', 'basic_auth', 'bearer_token']),
  service: z.string().min(1, 'Service is required'),
  data: z.object({}).passthrough(),
});

const updateSchema = createSchema.partial();

module.exports = { createSchema, updateSchema };
