const BaseNode = require('../baseNode');

class EmailReceive extends BaseNode {
  static getMeta() {
    return {
      label: 'Email Trigger',
      category: 'triggers',
      icon: 'mail',
      color: '#ef4444',
      description: 'Trigger workflow when an email is received via IMAP',
      inputs: 0,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'credentialId',
          type: 'credential',
          service: 'imap',
          label: 'IMAP Credential',
          required: true,
        },
        {
          key: 'folder',
          type: 'string',
          label: 'Folder',
          default: 'INBOX',
        },
      ],
    };
  }

  async execute(inputData) {
    return inputData;
  }
}

module.exports = EmailReceive;
