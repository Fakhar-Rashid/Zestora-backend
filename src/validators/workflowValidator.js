const { z } = require('zod');

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  triggerType: z.string().optional(),
  cronExpression: z.string().optional(),
});

const saveVersionSchema = z.object({
  nodesJson: z.array(z.any()),
  edgesJson: z.array(z.any()),
  viewportJson: z.object({}).passthrough().optional(),
});

module.exports = { createSchema, updateSchema, saveVersionSchema };
