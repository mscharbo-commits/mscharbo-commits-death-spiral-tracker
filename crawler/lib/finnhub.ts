import axios from 'axios';

export async function getCompanyFilings(symbol: string): Promise<any[]> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      console.error('❌ FINNHUB_API_KEY not set');
      return [];
    }

    console.log(`  Querying Finnhub for ${symbol}...`);

    const response = await axios.get('https://finnhub.io/api/v1/stock/filings', {
      params: {
        symbol: symbol,
        token: apiKey
      }
    });

    const filings = response.data || [];
    console.log(`  ✓ Found ${filings.length} filings`);
    return filings;
  } catch (error: any) {
    console.error(`Finnhub error for ${symbol}:`, error.response?.data || error.message);
    return [];
  }
}
