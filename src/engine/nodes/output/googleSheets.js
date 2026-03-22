const BaseNode = require('../baseNode');
const { google } = require('googleapis');

const toRows = (data) => {
  const items = Array.isArray(data) ? data : [data];
  if (!items.length) return [];
  const headers = Object.keys(items[0]);
  const rows = [headers];
  for (const item of items) {
    rows.push(headers.map((h) => (item[h] !== undefined ? String(item[h]) : '')));
  }
  return rows;
};

class GoogleSheets extends BaseNode {
  static getMeta() {
    return {
      label: 'Google Sheets',
      category: 'output',
      icon: 'table',
      color: '#34a853',
      description: 'Append data to a Google Sheets spreadsheet',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'credentialId', type: 'credential', service: 'google_sheets', label: 'Google Sheets Credential', required: true },
        { key: 'spreadsheetId', type: 'string', label: 'Spreadsheet ID', required: true },
        { key: 'sheetName', type: 'string', label: 'Sheet Name', default: 'Sheet1' },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, spreadsheetId, sheetName = 'Sheet1' } = this.config;
    const credential = await this.context.credentialService.getDecrypted(this.context.userId, credentialId);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: credential.accessToken });

    const sheets = google.sheets({ version: 'v4', auth });
    const data = inputData.items || inputData.comments || inputData.leads || inputData;
    const rows = toRows(data);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    return {
      success: true,
      updatedRange: response.data.updates?.updatedRange || null,
      updatedRows: response.data.updates?.updatedRows || 0,
    };
  }
}

module.exports = GoogleSheets;
