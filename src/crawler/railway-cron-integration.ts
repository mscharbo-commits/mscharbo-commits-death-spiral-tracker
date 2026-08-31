import { createClient } from '@supabase/supabase-js';
import { EDGARFetcher } from './edgar-fetcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runCrawler() {
  console.log(`[${new Date().toISOString()}] Starting EDGAR crawler...`);
  const fetcher = new EDGARFetcher();
  
  console.log('✅ Crawler completed');
}

if (require.main === module) {
  runCrawler().catch(e => { console.error(e); process.exit(1); });
}

export { runCrawler };
