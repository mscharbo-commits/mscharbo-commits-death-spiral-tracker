import { searchEdgar } from '../lib/edgar';
import { extractDeathSpiralTerms } from '../lib/sonnet';
import { createClient } from '../lib/supabase';
import axios from 'axios';

const FORM_TYPES = ['8-K', '10-Q', '10-K'];
const SEARCH_KEYWORDS = ['convertible note', 'convertible loan', 'convertible promissory'];

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

function hasConvertibleKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SEARCH_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export async function runDailyEdgarScan(initialScan: boolean = false) {
  const supabase = createClient();
  let totalFound = 0;
  let totalProcessed = 0;
  let totalToxic = 0;
  
  const daysBack = initialScan ? 1095 : 1;
  console.log(`[${new Date().toISOString()}] Starting EDGAR scan (${daysBack} days)...`);

  for (const formType of FORM_TYPES) {
    console.log(`\nSearching form type: ${formType}`);
    try {
      const results = await searchEdgar(formType, daysBack);
      console.log(`Found ${results.length} ${formType} filings`);

      for (const result of results) {
        const filingUrl = await getFilingUrl(result.cik, result.accessionNumber);
        const filingText = await getFilingText(filingUrl);
        
        if (!filingText) {
          console.log(`  ✗ ${result.conm} - couldn't fetch`);
          continue;
        }

        // Stage 1: Check if filing mentions convertible
        if (!hasConvertibleKeyword(filingText)) {
          continue;
        }

        console.log(`  📄 ${result.conm} - mentions convertible`);
        totalFound++;

        // Stage 2: Extract terms with Claude
        const terms = await extractDeathSpiralTerms(filingText, result.conm);
        if (!terms) {
          console.log(`    ✗ not a convertible note`);
          continue;
        }

        // Get or create company
        let company: any = null;
        const existingCompany = await supabase
          .from('death_spiral_companies')
          .select('id')
          .eq('cik', result.cik)
          .single();

        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase
            .from('death_spiral_companies')
            .insert([{ name: result.conm, cik: result.cik }])
            .select('id')
            .single();
          if (newCompany.data) company = newCompany.data;
        }

        if (!company) continue;

        // Save note with toxicity score
        const noteResult = await supabase
          .from('death_spiral_notes')
          .insert([{
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
          }])
          .select('id')
          .single();

        if (!noteResult.data) continue;

        // Save investors
        for (const investor of terms.noteHolders) {
          await supabase.from('death_spiral_investors').insert([{
            note_id: noteResult.data.id,
            investor_name: investor.name,
            principal: investor.principal || terms.principal,
            ownership_percentage: investor.ownershipPercentage,
          }]);
        }

        console.log(`    ✓ ${result.conm} - Score: ${terms.toxicityScore}/10`);
        if (terms.toxicityScore >= 6) {
          console.log(`      ⚠️  TOXIC: ${terms.redFlags.join(', ')}`);
          totalToxic++;
        }

        totalProcessed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error searching ${formType}:`, error);
    }
  }

  console.log(`\n[${new Date().toISOString()}] Scan complete!`);
  console.log(`Total filings with "convertible": ${totalFound}`);
  console.log(`Convertible notes found: ${totalProcessed}`);
  console.log(`Toxic (6+): ${totalToxic}`);
}

if (require.main === module) {
  const initialScan = process.argv[2] === 'initial';
  runDailyEdgarScan(initialScan).catch(console.error);
}
