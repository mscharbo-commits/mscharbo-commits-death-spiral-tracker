import { searchEdgar } from '../lib/edgar';
import { extractDeathSpiralTerms } from '../lib/sonnet';
import { supabase } from '../lib/supabase';

const KEYWORDS = ['convertible note', 'no floor', 'make whole'];

async function runDailyEdgarScan() {
  console.log('Starting daily EDGAR scan...');
  for (const keyword of KEYWORDS) {
    console.log('Searching for: ' + keyword);
    const filings = await searchEdgar(keyword);
    console.log('Found ' + filings.length + ' filings');
  }
  console.log('Scan complete');
}

runDailyEdgarScan().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
