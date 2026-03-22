const BaseNode = require('../baseNode');

class MergeNode extends BaseNode {
  static getMeta() {
    return {
      label: 'Merge',
      category: 'logic',
      icon: 'git-pull-request',
      color: '#f59e0b',
      description: 'Merge multiple inputs into a single output',
      inputs: 2,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'mode', type: 'select', label: 'Merge Mode', options: ['append', 'overwrite'], default: 'append' },
      ],
    };
  }

  async execute(inputData) {
    const { mode = 'append' } = this.config;

    if (Array.isArray(inputData)) {
      if (mode === 'append') {
        const flat = inputData.reduce((acc, item) => {
          if (Array.isArray(item)) return [...acc, ...item];
          return [...acc, item];
        }, []);
        return { merged: flat, count: flat.length };
      }
      return { merged: Object.assign({}, ...inputData), count: inputData.length };
    }

    return { merged: [inputData], count: 1 };
  }
}

module.exports = MergeNode;
