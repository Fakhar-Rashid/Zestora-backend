const BaseNode = require('../baseNode');
const puppeteer = require('puppeteer');

class GoogleMapsScrape extends BaseNode {
  static getMeta() {
    return {
      label: 'Google Maps Scrape',
      category: 'data',
      icon: 'map-pin',
      color: '#34d399',
      description: 'Scrape business data from Google Maps',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'query', type: 'string', label: 'Search Query', required: true },
        { key: 'maxResults', type: 'number', label: 'Max Results', default: 10 },
        { key: 'extractName', type: 'checkbox', label: 'Extract Name', default: true },
        { key: 'extractWebsite', type: 'checkbox', label: 'Extract Website', default: false },
        { key: 'extractPhone', type: 'checkbox', label: 'Extract Phone', default: false },
        { key: 'extractEmail', type: 'checkbox', label: 'Extract Email', default: false },
      ],
    };
  }

  async execute() {
    const { query, maxResults = 10, extractName = true, extractWebsite = false, extractPhone = false, extractEmail = false } = this.config;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const leads = [];

    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[role="feed"]', { timeout: 10000 }).catch(() => null);

      const results = await page.evaluate((max) => {
        const items = document.querySelectorAll('[role="feed"] > div > div > a');
        const data = [];
        const limit = Math.min(items.length, max);
        for (let i = 0; i < limit; i++) {
          const el = items[i];
          data.push({
            name: el.getAttribute('aria-label') || '',
            url: el.href || '',
          });
        }
        return data;
      }, maxResults);

      for (const r of results) {
        const lead = {};
        if (extractName) lead.name = r.name;
        lead.mapsUrl = r.url;
        if (extractWebsite) lead.website = '';
        if (extractPhone) lead.phone = '';
        if (extractEmail) lead.email = '';
        leads.push(lead);
      }
    } finally {
      await browser.close();
    }

    return { leads };
  }
}

module.exports = GoogleMapsScrape;
