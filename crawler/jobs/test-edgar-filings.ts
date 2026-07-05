import axios from 'axios';
import { extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';

// Direct SEC Archive URLs from your test pack
const TEST_URLS = [
  'https://www.sec.gov/Archives/edgar/data/1853070/000162828028024049987/0001628280-24-049987-index.htm',
  'https://www.sec.gov/Archives/edgar/data/1138978/000149315224025430/0001493152-24-025430-index.htm',
  'https://www.sec.gov/Archives/edgar/data/1804469/000121390024022883/0001213900-24-022883-index.htm',
  'https://www.sec.gov/Archives/edgar/data/1499961/000182912624005824/0001829126-24-005824-index.htm',
  'https://www.sec.gov/Archives/edgar/data/1805521/000121390024076294/0001213900-24-076294-index.htm'
];

async function getFilingText(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'ConvertibleSecuritiesAnalyzer/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

async function testFilings() {
  const supabase = createClient();
  let tested = 0;
  let foundConvertibles = 0;
  let highRisk = 0;

  console.log(`\n🚀 TESTING 50-FILING EDGAR TEST PACK\n`);

  for (const url of TEST_URLS) {
    console.log(`📄 ${url.split('/data/')[1]?.split('/')[0] || 'Filing'}`);
    
    const filingText = await getFilingText(url);
    if (!filingText) {
      console.log(`  ✗ Failed to fetch`);
      continue;
    }

    tested++;
    console.log(`  ✓ Fetched (${filingText.length} chars)`);

    if (!filingText.toLowerCase().includes('convertible')) {
      console.log(`  - No convertible mention`);
      continue;
    }

    foundConvertibles++;
    console.log(`  🔍 Found convertible reference`);

    const convertible = await extractToxicConvertible(filingText);
    if (convertible) {
      highRisk++;
      console.log(`  ⚠️  HIGH-RISK: ${convertible.dealName} (${convertible.toxicityScore}/10)`);
      console.log(`     Red flags: ${convertible.redFlags.join(', ')}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ TEST RESULTS`);
  console.log(`📊 Filings tested: ${tested}`);
  console.log(`🔍 Convertible mentions: ${foundConvertibles}`);
  console.log(`⚠️  HIGH-RISK FOUND: ${highRisk}\n`);
}

testFilings().catch(console.error);
