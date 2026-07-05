import axios from 'axios';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function getCompanyFilings(symbol: string): Promise<any[]> {
  try {
    console.log(`  Querying Finnhub for ${symbol} filings...`);

    const response = await axios.get('https://finnhub.io/api/v1/stock/filings', {
      params: {
        symbol: symbol,
        token: FINNHUB_API_KEY
      }
    });

    const filings = response.data || [];
    console.log(`  ✓ Found ${filings.length} filings`);
    return filings;
  } catch (error) {
    console.error(`Finnhub error for ${symbol}:`, error);
    return [];
  }
}
