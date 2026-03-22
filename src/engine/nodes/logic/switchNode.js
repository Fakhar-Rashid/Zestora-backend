const BaseNode = require('../baseNode');

class SwitchNode extends BaseNode {
  static getMeta() {
    return {
      label: 'Switch',
      category: 'logic',
      icon: 'git-merge',
      color: '#f59e0b',
      description: 'Route data based on matching cases',
      inputs: 1,
      outputs: 4,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'field', type: 'string', label: 'Field to Match', required: true },
        { key: 'cases', type: 'textarea', label: 'Cases (JSON array)', default: '[{"value": "option1", "label": "Case 1"}]' },
      ],
    };
  }

  async execute(inputData) {
    const { field, cases } = this.config;
    const fieldValue = inputData[field];

    let parsedCases;
    try {
      parsedCases = typeof cases === 'string' ? JSON.parse(cases) : cases;
    } catch {
      parsedCases = [];
    }

    const matched = parsedCases.find((c) => String(c.value) === String(fieldValue));

    return {
      matchedCase: matched ? matched.label || matched.value : 'default',
      matchedValue: matched ? matched.value : null,
      data: inputData,
    };
  }
}

module.exports = SwitchNode;
