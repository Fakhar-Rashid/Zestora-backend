const BaseNode = require('../baseNode');

const toCsv = (data) => {
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeField = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escapeField).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeField(row[h])).join(','));
  }
  return lines.join('\n');
};

class CsvExport extends BaseNode {
  static getMeta() {
    return {
      label: 'CSV Export',
      category: 'output',
      icon: 'file-spreadsheet',
      color: '#22c55e',
      description: 'Export data as CSV',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'filename', type: 'string', label: 'Filename', default: 'export.csv' },
      ],
    };
  }

  async execute(inputData) {
    const { filename = 'export.csv' } = this.config;
    const data = inputData.items || inputData.comments || inputData.leads || inputData;
    const csv = toCsv(data);
    return { csv, filename };
  }
}

module.exports = CsvExport;
