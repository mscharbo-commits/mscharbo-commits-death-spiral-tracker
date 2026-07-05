import puppeteer from 'puppeteer';

export async function scrapeEdgarSearch(keyword: string): Promise<any[]> {
  let browser;
  try {
    console.log(`  Launching browser for "${keyword}"...`);
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Go to SEC EDGAR search
    await page.goto(`https://www.sec.gov/edgar/search/?q=${encodeURIComponent(keyword)}&count=100`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for results table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => {});

    // Extract data from rendered page
    const filings = await page.evaluate(() => {
      const rows: any[] = [];
      document.querySelectorAll('table tbody tr').forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return;

        const form = cells[0]?.textContent?.trim() || '';
        const company = cells[1]?.textContent?.trim() || '';
        const filed = cells[2]?.textContent?.trim() || '';
        const link = cells[0]?.querySelector('a')?.href || '';

        if (company && form) {
          rows.push({
            form,
            conm: company,
            filedAt: filed,
            link
          });
        }
      });
      return rows;
    });

    console.log(`  ✓ Found ${filings.length} results`);
    return filings;
  } catch (error) {
    console.error(`Browser error for "${keyword}":`, error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}
