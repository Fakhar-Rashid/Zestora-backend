const BaseNode = require('../baseNode');

const evaluateCondition = (fieldValue, operator, compareValue) => {
  switch (operator) {
    case 'equals':
      return String(fieldValue) === String(compareValue);
    case 'notEquals':
      return String(fieldValue) !== String(compareValue);
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    case 'greaterThan':
      return Number(fieldValue) > Number(compareValue);
    case 'lessThan':
      return Number(fieldValue) < Number(compareValue);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return false;
  }
};

class IfCondition extends BaseNode {
  static getMeta() {
    return {
      label: 'IF Condition',
      category: 'logic',
      icon: 'git-branch',
      color: '#f59e0b',
      description: 'Branch workflow based on a condition',
      inputs: 1,
      outputs: 2,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'field', type: 'string', label: 'Field to Check', required: true },
        { key: 'operator', type: 'select', label: 'Operator', options: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists'], required: true },
        { key: 'value', type: 'string', label: 'Value' },
      ],
    };
  }

  async execute(inputData) {
    const { field, operator, value } = this.config;
    const fieldValue = inputData[field];
    const result = evaluateCondition(fieldValue, operator, value);

    return { result, data: inputData, branch: result ? 'true' : 'false' };
  }
}

module.exports = IfCondition;
