import axios from 'axios';
import { extractToxicConvertible } from '../lib/signals';
import * as fs from 'fs';

const TEST_URLS = JSON.parse(fs.readFileSync('crawler/data/test-urls.json', 'utf-8'));

async function getFilingText(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: { 'User-Agent': 'ConvertibleSecuritiesAnalyzer/1.0' }
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

async function testFilings() {
  let tested = 0;
  let foundConvertibles = 0;
  let highRisk = 0;

  console.log(`\n🚀 TESTING ${TEST_URLS.length} EDGAR FILINGS\n`);

  for (const url of TEST_URLS) {
    const filing = url.split('/data/')[1]?.split('/')[0] || 'Filing';
    console.log(`📄 ${filing}`);
    
    const filingText = await getFilingText(url);
    if (!filingText) {
      console.log(`  ✗ Failed`);
      continue;
    }

    tested++;
    if (!filingText.toLowerCase().includes('convertible')) {
      console.log(`  - No convertible`);
      continue;
    }

    foundConvertibles++;
    console.log(`  🔍 Convertible found`);

    const convertible = await extractToxicConvertible(filingText);
    if (convertible) {
      highRisk++;
      console.log(`  ⚠️  ${convertible.dealName} (${convertible.toxicityScore}/10)`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n✅ RESULTS`);
  console.log(`📊 Tested: ${tested}`);
  console.log(`🔍 With convertibles: ${foundConvertibles}`);
  console.log(`⚠️  HIGH-RISK: ${highRisk}\n`);
}

testFilings().catch(console.error);
