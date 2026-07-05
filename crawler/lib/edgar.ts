import axios from 'axios';

export async function searchEdgar(keyword: string, daysBack: number = 1095): Promise<any[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log(`  Searching for "${keyword}" from ${startDateStr} to ${endDateStr}...`);

    const response = await axios.get('https://www.sec.gov/cgi-bin/browse-edgar', {
      params: {
        action: 'getcompany',
        q: keyword,
        startdt: startDateStr,
        enddt: endDateStr,
        owner: 'exclude',
        count: 100,
        output: 'json'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Death-Spiral-Tracker/1.0)'
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
