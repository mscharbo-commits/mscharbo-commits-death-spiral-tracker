import { searchEdgar } from '../lib/edgar';
import { extractDeathSpiralTerms } from '../lib/sonnet';
import { createClient } from '../lib/supabase';
import axios from 'axios';

const KEYWORDS = ['convertible note', 'convertible loan', 'convertible security'];

async function getFilingUrl(cik: string, accessionNumber: string): Promise<string> {
  return `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accessionNumber}&xbrl_type=v`;
}

async function getFilingText(filingUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(filingUrl, { timeout: 10000 });
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function runDailyEdgarScan(initialScan: boolean = false) {
  const supabase = createClient();
  let totalFound = 0;
  let totalProcessed = 0;
  let totalToxic = 0;
  
  const daysBack = initialScan ? 1095 : 1;
  console.log(`[${new Date().toISOString()}] Starting scan (${daysBack} days back)...\n`);

  for (const keyword of KEYWORDS) {
    console.log(`Keyword: "${keyword}"`);
    try {
      const results = await searchEdgar(keyword, daysBack);

      for (const result of results) {
        totalFound++;
        
        const filingUrl = await getFilingUrl(result.cik, result.accessionNumber);
        const filingText = await getFilingText(filingUrl);
        if (!filingText) continue;

        const terms = await extractDeathSpiralTerms(filingText, result.conm);
        if (!terms) continue;

        let company: any = null;
        const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('cik', result.cik).single();
        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase.from('death_spiral_companies').insert([{ name: result.conm, cik: result.cik }]).select('id').single();
          if (newCompany.data) company = newCompany.data;
        }

        if (!company) continue;

        const noteResult = await supabase.from('death_spiral_notes').insert([{
          company_id: company.id,
          deal_name: terms.dealName,
          total_principal: terms.principal,
          conversion_rate: terms.conversion_rate,
          no_floor: terms.noFloor,
          make_whole: terms.makeWhole,
          shares_registered: terms.sharesRegistered,
          registration_rights: terms.registrationRights,
          toxicity_score: terms.toxicityScore,
          red_flags: terms.redFlags,
          green_flags: terms.greenFlags,
          is_toxic: terms.toxicityScore >= 6,
          filing_url: filingUrl,
          filing_date: new Date(result.filedAt).toISOString().split('T')[0],
        }]).select('id').single();

        if (!noteResult.data) continue;

        for (const investor of terms.noteHolders) {
          await supabase.from('death_spiral_investors').insert([{
            note_id: noteResult.data.id,
            investor_name: investor.name,
            principal: investor.principal || terms.principal,
            ownership_percentage: investor.ownershipPercentage,
          }]);
        }

        console.log(`  ✓ ${result.conm} - Score: ${terms.toxicityScore}/10`);
        if (terms.toxicityScore >= 6) {
          console.log(`    ⚠️  ${terms.redFlags.join(', ')}`);
          totalToxic++;
        }

        totalProcessed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Error:`, error);
    }
  }

  console.log(`\n[${new Date().toISOString()}] Done!`);
  console.log(`Results: ${totalFound} mentions | ${totalProcessed} deals | ${totalToxic} toxic`);
}

if (require.main === module) {
  const initialScan = process.argv[2] === 'initial';
  runDailyEdgarScan(initialScan).catch(console.error);
}
