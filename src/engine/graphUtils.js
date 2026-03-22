const TRIGGER_PREFIXES = ['manual-trigger', 'whatsapp-receive', 'telegram-receive', 'webhook-trigger', 'schedule-trigger', 'email-receive'];

const buildAdjacencyList = (nodes, edges) => {
  const adjacency = new Map();
  const reverseAdj = new Map();
  const nodeMap = new Map();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    reverseAdj.set(node.id, []);
    nodeMap.set(node.id, node);
  }

  for (const edge of edges) {
    const targets = adjacency.get(edge.source);
    if (targets) targets.push(edge.target);

    const sources = reverseAdj.get(edge.target);
    if (sources) sources.push(edge.source);
  }

  return { adjacency, reverseAdj, nodeMap };
};

const getRegistryType = (node) =>
  node.data?.registryType || node.data?.nodeType?.type || node.type || '';

const isTriggerType = (node) =>
  TRIGGER_PREFIXES.includes(getRegistryType(node));

const findTriggerNode = (nodes) => {
  return nodes.find(isTriggerType) || null;
};

const topologicalSort = (nodes, edges) => {
  const { adjacency, reverseAdj } = buildAdjacencyList(nodes, edges);
  const inDegree = new Map();

  for (const node of nodes) {
    inDegree.set(node.id, (reverseAdj.get(node.id) || []).length);
  }

  const queue = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDegree = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Cycle detected in workflow graph');
  }

  return sorted;
};

const getUpstreamNodeIds = (nodeId, reverseAdj) => {
  return reverseAdj.get(nodeId) || [];
};

module.exports = { buildAdjacencyList, findTriggerNode, topologicalSort, getUpstreamNodeIds };
