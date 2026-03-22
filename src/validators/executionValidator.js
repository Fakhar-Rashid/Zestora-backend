const { z } = require('zod');

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  workflowId: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'running', 'success', 'failed', 'cancelled'])
    .optional(),
});

module.exports = { listQuerySchema };
