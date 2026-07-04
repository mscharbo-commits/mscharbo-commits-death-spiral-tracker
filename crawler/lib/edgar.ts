import axios from 'axios';

export async function searchEdgar(keyword: string): Promise<any[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateFrom = yesterday.toISOString().split('T')[0];

    const response = await axios.get('https://www.sec.gov/cgi-bin/browse-edgar', {
      params: {
        action: 'getcompany',
        search_text: keyword,
        owner: 'exclude',
        after: dateFrom,
        count: 100,
        output: 'json'
      }
    });

    return response.data.hits?.hits || [];
  } catch (error) {
    console.error('EDGAR search error:', error);
    return [];
  }
}
