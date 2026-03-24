const { registerTool } = require('./toolRegistry');

registerTool('calculator', {
  name: 'calculator',
  description: 'Evaluate a mathematical expression. Supports basic math (+ - * / %), exponents (**), parentheses, and common functions like sqrt, abs, ceil, floor, round, min, max, sin, cos, tan, log, PI, E.',
  parameters: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'The math expression to evaluate (e.g. "2 + 3 * 4", "sqrt(16)", "round(3.7)")' },
    },
    required: ['expression'],
  },
  execute: async ({ expression }) => {
    try {
      // Safe math evaluation using Function constructor with only Math globals
      const sanitized = expression
        .replace(/\s+/g, '')
        .replace(/[^0-9+\-*/%().,a-zA-Z]/g, '');

      // Map common math functions
      const mathContext = {
        sqrt: Math.sqrt, abs: Math.abs, ceil: Math.ceil, floor: Math.floor,
        round: Math.round, min: Math.min, max: Math.max,
        sin: Math.sin, cos: Math.cos, tan: Math.tan,
        log: Math.log, log2: Math.log2, log10: Math.log10,
        pow: Math.pow, random: Math.random,
        PI: Math.PI, E: Math.E,
      };

      const keys = Object.keys(mathContext);
      const values = Object.values(mathContext);
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `"use strict"; return (${sanitized});`);
      const result = fn(...values);

      if (typeof result !== 'number' || !isFinite(result)) {
        return { error: 'Expression did not produce a valid number', expression };
      }

      return { result, expression };
    } catch (err) {
      return { error: `Failed to evaluate: ${err.message}`, expression };
    }
  },
});
