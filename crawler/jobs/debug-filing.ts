import { getCompanyFilings } from '../lib/finnhub';
import axios from 'axios';

async function debugFiling() {
  console.log('Fetching COIN filings...');
  const filings = await getCompanyFilings('COIN');
  
  if (filings.length > 0) {
    const filing = filings[0];
    console.log('\nFirst filing:');
    console.log(JSON.stringify(filing, null, 2));
    
    if (filing.filingUrl || filing.url) {
      const url = filing.filingUrl || filing.url;
      console.log(`\nTrying to fetch: ${url}`);
      
      try {
        const response = await axios.get(url, { timeout: 10000 });
        console.log(`\nResponse length: ${response.data.length} characters`);
        console.log(`First 500 chars:\n${response.data.substring(0, 500)}`);
      } catch (error) {
        console.error('Failed to fetch:', error);
      }
    }
  }
}

debugFiling();
