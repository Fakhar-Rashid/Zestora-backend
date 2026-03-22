const BaseNode = require('../baseNode');
const { google } = require('googleapis');

class GoogleDocs extends BaseNode {
  static getMeta() {
    return {
      label: 'Google Docs',
      category: 'output',
      icon: 'file-text',
      color: '#4285f4',
      description: 'Append text to a Google Docs document',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'credentialId', type: 'credential', service: 'google_docs', label: 'Google Docs Credential', required: true },
        { key: 'documentId', type: 'string', label: 'Document ID', required: true },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, documentId } = this.config;
    const credential = await this.context.credentialService.getDecrypted(this.context.userId, credentialId);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: credential.accessToken });

    const docs = google.docs({ version: 'v1', auth });

    const text = inputData.summary || inputData.responseMessage || inputData.content || JSON.stringify(inputData, null, 2);

    const doc = await docs.documents.get({ documentId });
    const endIndex = doc.data.body.content.slice(-1)[0]?.endIndex || 1;

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndex - 1 },
              text: `\n${text}`,
            },
          },
        ],
      },
    });

    return { success: true, documentId, appendedLength: text.length };
  }
}

module.exports = GoogleDocs;
