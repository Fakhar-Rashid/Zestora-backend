const BaseNode = require('../baseNode');

class TextOutput extends BaseNode {
  static getMeta() {
    return {
      label: 'Text Output',
      category: 'output',
      icon: 'file-text',
      color: '#10b981',
      description: 'Display text output on the canvas',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'dataField',
          type: 'string',
          label: 'Data Field',
          default: '',
          description: 'Key to extract from input (e.g. responseMessage). Leave empty to show all data.',
          placeholder: 'responseMessage',
        },
        {
          key: 'maxLength',
          type: 'number',
          label: 'Max Display Length',
          default: 500,
          min: 50,
          max: 5000,
          description: 'Maximum characters to display on the node',
        },
      ],
    };
  }

  async execute(inputData) {
    const { dataField, maxLength = 500 } = this.config;

    let displayText;

    if (dataField && dataField.trim()) {
      // Extract specific field — supports dot notation like "data.result"
      const keys = dataField.trim().split('.');
      let value = inputData;
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }

      if (value === undefined || value === null) {
        displayText = `[Field "${dataField}" not found in input]`;
      } else if (typeof value === 'object') {
        displayText = JSON.stringify(value, null, 2);
      } else {
        displayText = String(value);
      }
    } else {
      // Show the most relevant field automatically
      displayText =
        inputData.responseMessage ||
        inputData.message ||
        inputData.content ||
        inputData.text ||
        inputData.csv ||
        inputData.result ||
        (typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2));
    }

    // Truncate
    const truncated = displayText.length > maxLength
      ? displayText.slice(0, maxLength) + '...'
      : displayText;

    return {
      ...inputData,
      displayText: truncated,
      fullText: displayText,
      textLength: displayText.length,
      wasTruncated: displayText.length > maxLength,
    };
  }
}

module.exports = TextOutput;
