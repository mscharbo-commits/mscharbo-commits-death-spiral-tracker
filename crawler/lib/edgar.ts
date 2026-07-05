import puppeteer from 'puppeteer';
import fs from 'fs';

export async function scrapeEdgarSearch(keyword: string): Promise<any[]> {
  let browser;
  try {
    console.log(`  Launching browser for "${keyword}"...`);
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const url = `https://www.sec.gov/edgar/search/?q=${encodeURIComponent(keyword)}&count=100`;
    console.log(`  URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Debug: Save HTML to file
    const html = await page.content();
    fs.writeFileSync(`/tmp/edgar_${keyword.replace(/\s+/g, '_')}.html`, html);
    console.log(`  Saved HTML to /tmp/edgar_${keyword.replace(/\s+/g, '_')}.html`);

    // Debug: Check what's in the page
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log(`  Page text length: ${pageText.length}`);
    if (pageText.includes('convertible') || pageText.includes('results')) {
      console.log(`  ✓ Page contains data`);
    } else {
      console.log(`  ✗ Page might be empty or blocked`);
    }

    // Try different selectors
    const selectors = [
      'table tbody tr',
      '.results tr',
      '[data-test="filing-row"]',
      '.filing-row',
      'tr[data-filing]'
    ];

    let filings: any[] = [];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 }).catch(() => {});
        filings = await page.evaluate((sel) => {
          const rows: any[] = [];
          document.querySelectorAll(sel).forEach((row: any) => {
            rows.push({
              html: row.innerHTML,
              text: row.innerText
            });
          });
          return rows;
        }, selector);
        
        if (filings.length > 0) {
          console.log(`  ✓ Found ${filings.length} rows with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    return filings.length > 0 ? filings : [];
  } catch (error) {
    console.error(`Browser error:`, error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}
