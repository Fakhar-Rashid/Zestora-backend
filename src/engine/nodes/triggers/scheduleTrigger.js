const BaseNode = require('../baseNode');

class ScheduleTrigger extends BaseNode {
  static getMeta() {
    return {
      label: 'Schedule Trigger',
      category: 'triggers',
      icon: 'clock',
      color: '#8b5cf6',
      description: 'Trigger workflow on a cron schedule',
      inputs: 0,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'cronExpression',
          type: 'string',
          label: 'Cron Expression',
          required: true,
          placeholder: '0 9 * * *',
        },
      ],
    };
  }

  async execute(inputData) {
    return {
      triggeredAt: new Date().toISOString(),
      ...inputData,
    };
  }
}

module.exports = ScheduleTrigger;
