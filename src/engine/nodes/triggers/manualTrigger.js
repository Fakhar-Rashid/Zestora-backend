const BaseNode = require('../baseNode');

class ManualTrigger extends BaseNode {
  static getMeta() {
    return {
      label: 'Manual Trigger',
      category: 'triggers',
      icon: 'play',
      color: '#6366f1',
      description: 'Manually start a workflow run',
      inputs: 0,
      outputs: 1,
    };
  }

  static getSchema() {
    return { fields: [] };
  }

  async execute(inputData) {
    return inputData;
  }
}

module.exports = ManualTrigger;
