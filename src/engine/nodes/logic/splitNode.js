const BaseNode = require('../baseNode');

class SplitNode extends BaseNode {
  static getMeta() {
    return {
      label: 'Split',
      category: 'logic',
      icon: 'scissors',
      color: '#f59e0b',
      description: 'Split an array field into individual items',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'field', type: 'string', label: 'Array Field to Split' },
      ],
    };
  }

  async execute(inputData) {
    const { field } = this.config;
    let array;

    if (field && inputData[field]) {
      array = Array.isArray(inputData[field]) ? inputData[field] : [inputData[field]];
    } else if (Array.isArray(inputData)) {
      array = inputData;
    } else {
      array = [inputData];
    }

    return { items: array, count: array.length };
  }
}

module.exports = SplitNode;
