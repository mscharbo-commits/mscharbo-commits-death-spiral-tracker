import { searchEdgar } from '../lib/edgar';
import { extractDeathSpiralTerms } from '../lib/sonnet';
import { createClient } from '../lib/supabase';
import axios from 'axios';

const KEYWORDS = [
  'convertible note',
  'convertible promissory note',
  'no floor',
  'floorless',
  'minimum conversion rate',
  'true up',
  'make whole',
  'floating conversion rate',
  'variable conversion rate',
  'toxic',
  'death spiral',
  'reset provision',
  'ratchet convertible',
  'variable rate note',
  'beneficial ownership limitation',
  'look-back period',
  'lookback period',
  'mfn clause',
  'warrant coverage',
  'registration rights',
];

async function getFilingUrl(cik: string, accessionNumber: string): Promise<string> {
  return `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accessionNumber}&xbrl_type=v`;
}

async function getFilingText(filingUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(filingUrl, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch filing: ${filingUrl}`, error);
    return null;
  }
}

export async function runDailyEdgarScan(initialScan: boolean = false) {
  const supabase = createClient();
  let totalFound = 0;
  let totalProcessed = 0;
  
  const daysBack = initialScan ? 1095 : 1;
  console.log(`[${new Date().toISOString()}] Starting EDGAR scan (searching back ${daysBack} days)...`);

  for (const keyword of KEYWORDS) {
    console.log(`Searching for: "${keyword}"`);
    try {
      const results = await searchEdgar(keyword, daysBack);
      console.log(`Found ${results.length} results for "${keyword}"`);

      for (const result of results) {
        totalFound++;

        let company: any = null;
        const existingCompany = await supabase
          .from('death_spiral_companies')
          .select('id, cik, name')
          .eq('cik', result.cik)
          .single();

        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase
            .from('death_spiral_companies')
            .insert([{ name: result.conm, cik: result.cik }])
            .select('id, cik, name')
            .single();
          if (newCompany.data) {
            company = newCompany.data;
          }
        }

        if (!company) {
          console.error(`Failed to get/create company: ${result.conm}`);
          continue;
        }

        const filingUrl = await getFilingUrl(result.cik, result.accessionNumber);
        const filingText = await getFilingText(filingUrl);

        if (!filingText) {
          console.warn(`Could not fetch filing text: ${result.conm}`);
          continue;
        }

        const terms = await extractDeathSpiralTerms(filingText, result.conm);

        if (!terms) {
          console.log(`${result.conm}: Not a death spiral note`);
          continue;
        }

        console.log(`✓ FOUND: ${result.conm} - ${terms.dealName}`);
        console.log(`  Investors: ${terms.noteHolders.map((i: any) => i.name).join(', ')}`);
        console.log(`  Total Principal: $${terms.principal}`);
        console.log(`  Shares Registered: ${terms.sharesRegistered ? 'YES' : 'NO'}`);

        const noteResult = await supabase
          .from('death_spiral_notes')
          .insert([
            {
              company_id: company.id,
              deal_name: terms.dealName,
              total_principal: terms.principal,
              conversion_rate: terms.conversion_rate,
              no_floor: terms.noFloor,
              make_whole: terms.makeWhole,
              filing_url: filingUrl,
              filing_date: new Date(result.filedAt).toISOString().split('T')[0],
            },
          ])
          .select('id')
          .single();

        if (!noteResult.data) {
          console.error(`Failed to insert note for ${result.conm}`);
          continue;
        }

        for (const investor of terms.noteHolders) {
          await supabase.from('death_spiral_investors').insert([
            {
              note_id: noteResult.data.id,
              investor_name: investor.name,
              principal: investor.principal || terms.principal,
              ownership_percentage: investor.ownershipPercentage,
              beneficial_ownership_cap: investor.beneficialOwnershipCap,
            },
          ]);
        }

        totalProcessed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error searching for "${keyword}":`, error);
    }
  }

  console.log(`[${new Date().toISOString()}] Daily scan complete!`);
  console.log(`Total hits: ${totalFound}`);
  console.log(`Death spirals found: ${totalProcessed}`);
}

if (require.main === module) {
  const initialScan = process.argv[2] === 'initial';
  runDailyEdgarScan(initialScan).catch(console.error);
}
