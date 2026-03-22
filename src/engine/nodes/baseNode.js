class BaseNode {
  constructor(nodeConfig, context) {
    this.config = nodeConfig;
    this.context = context;
  }

  async execute(inputData) {
    throw new Error('execute() must be implemented');
  }

  static getSchema() {
    throw new Error('getSchema() must be implemented');
  }

  static getMeta() {
    throw new Error('getMeta() must be implemented');
  }
}

module.exports = BaseNode;
