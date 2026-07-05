import axios from 'axios';

export async function searchEdgar(formType: string, daysBack: number = 1): Promise<any[]> {
  try {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    const dateFrom = date.toISOString().split('T')[0];

    const response = await axios.get('https://www.sec.gov/cgi-bin/browse-edgar', {
      params: {
        action: 'getcompany',
        type: formType,
        dateb: dateFrom,
        owner: 'exclude',
        count: 100,
        output: 'json'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Death-Spiral-Tracker/1.0)'
      },
      timeout: 30000
    });

    return response.data.hits?.hits || [];
  } catch (error) {
    console.error(`EDGAR search error for form ${formType}:`, error);
    return [];
  }
}
