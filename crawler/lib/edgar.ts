import axios from 'axios';
import xml2js from 'xml2js';

const parser = new xml2js.Parser();

export async function getFeedingsFromRSS(daysBack: number = 1): Promise<any[]> {
  try {
    // SEC publishes daily RSS feeds of recent filings
    const feeds = [
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=10-K&dateb=&owner=exclude&count=100&output=rss',
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=10-Q&dateb=&owner=exclude&count=100&output=rss',
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=8-K&dateb=&owner=exclude&count=100&output=rss',
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=S-1&dateb=&owner=exclude&count=100&output=rss',
    ];

    let allFilings: any[] = [];

    for (const feedUrl of feeds) {
      console.log(`  Fetching ${feedUrl.split('type=')[1]?.split('&')[0]}...`);
      
      const response = await axios.get(feedUrl, {
        headers: { 'User-Agent': 'InvestmentSignalEngine/1.0' },
        timeout: 10000
      });

      const result = await parser.parseStringPromise(response.data);
      const items = result.rss?.channel?.[0]?.item || [];

      allFilings.push(...items);
    }

    return allFilings;
  } catch (error) {
    console.error('RSS fetch error:', error);
    return [];
  }
}
