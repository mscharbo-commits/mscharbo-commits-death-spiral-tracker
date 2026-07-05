import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeEdgarSearch(keyword: string): Promise<any[]> {
  try {
    console.log(`  Scraping SEC EDGAR for "${keyword}"...`);

    // Hit the actual SEC EDGAR search page
    const response = await axios.get('https://www.sec.gov/edgar/search/', {
      params: {
        q: keyword,
        count: 100
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const filings: any[] = [];

    // Parse the search results table
    $('table tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const companyName = $(cells[0]).text().trim();
      const formType = $(cells[1]).text().trim();
      const filedDate = $(cells[2]).text().trim();
      const link = $(cells[0]).find('a').attr('href');

      if (companyName && link) {
        filings.push({
          conm: companyName,
          form: formType,
          filedAt: filedDate,
          link: link.startsWith('http') ? link : `https://www.sec.gov${link}`
        });
      }
    });

    console.log(`  ✓ Found ${filings.length} results`);
    return filings;
  } catch (error) {
    console.error(`Scrape error for "${keyword}":`, error);
    return [];
  }
}
