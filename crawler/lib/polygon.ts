import axios from 'axios';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

export async function getCompanyFilings(ticker: string): Promise<any[]> {
  try {
    console.log(`  Querying Polygon for ${ticker} filings...`);

    const response = await axios.get(`https://api.polygon.io/v3/reference/financials`, {
      params: {
        ticker: ticker,
        apikey: POLYGON_API_KEY,
        limit: 50
      }
    });

    const filings = response.data.results || [];
    console.log(`  ✓ Found ${filings.length} filings`);
    return filings;
  } catch (error) {
    console.error(`Polygon error for ${ticker}:`, error);
    return [];
  }
}

export async function getTopTickers(): Promise<string[]> {
  try {
    console.log(`  Fetching top tickers from Polygon...`);

    const response = await axios.get(`https://api.polygon.io/v3/snapshot/market/tickers`, {
      params: {
        apikey: POLYGON_API_KEY,
        limit: 100
      }
    });

    const tickers = response.data.results?.map((t: any) => t.ticker).slice(0, 20) || [];
    console.log(`  ✓ Got ${tickers.length} tickers`);
    return tickers;
  } catch (error) {
    console.error('Polygon error:', error);
    return [];
  }
}
