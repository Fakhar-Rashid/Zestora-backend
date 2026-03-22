const BaseNode = require('../baseNode');

class WebhookTrigger extends BaseNode {
  static getMeta() {
    return {
      label: 'Webhook Trigger',
      category: 'triggers',
      icon: 'webhook',
      color: '#f59e0b',
      description: 'Trigger workflow via an incoming HTTP webhook',
      inputs: 0,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'httpMethod',
          type: 'select',
          label: 'Method',
          options: ['POST', 'GET'],
          default: 'POST',
        },
      ],
    };
  }

  async execute(inputData) {
    return inputData;
  }
}

module.exports = WebhookTrigger;
