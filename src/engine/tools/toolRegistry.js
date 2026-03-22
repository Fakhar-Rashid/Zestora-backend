const tools = new Map();
const registerTool = (name, tool) => tools.set(name, tool);
const getTool = (name) => tools.get(name);
const getAllTools = () => Array.from(tools.values());
const getToolDefinitions = () =>
  getAllTools().map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }));

module.exports = { registerTool, getTool, getAllTools, getToolDefinitions };
