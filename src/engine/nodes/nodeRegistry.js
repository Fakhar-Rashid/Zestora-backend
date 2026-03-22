const registry = new Map();

const registerNode = (type, nodeClass) => {
  registry.set(type, nodeClass);
};

const getNode = (type) => registry.get(type);

const getAllNodeMetas = () => {
  return Array.from(registry.entries()).map(([type, cls]) => ({
    type,
    ...cls.getMeta(),
    schema: cls.getSchema(),
  }));
};

module.exports = { registerNode, getNode, getAllNodeMetas };
