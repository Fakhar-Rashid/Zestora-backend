const resolveTemplate = (template, data) => {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
};

module.exports = { resolveTemplate };
