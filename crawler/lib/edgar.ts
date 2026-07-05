import axios from 'axios';

export async function searchEdgar(keyword: string, daysBack: number = 1): Promise<any[]> {
  try {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    const dateFrom = date.toISOString().split('T')[0];

    console.log(`  Searching for "${keyword}" since ${dateFrom}...`);

    const response = await axios.get('https://www.sec.gov/cgi-bin/browse-edgar', {
      params: {
        action: 'getcompany',
        search_text: keyword,
        owner: 'exclude',
        after: dateFrom,
        count: 100,
        output: 'json'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Death-Spiral-Tracker/1.0)',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const hits = response.data?.hits?.hits || [];
    console.log(`  Found ${hits.length} results`);
    return hits;
  } catch (error) {
    console.error(`EDGAR error:`, error);
    return [];
  }
}
