import { searchEdgar } from '../lib/edgar';
import { extractSignals, extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';
import axios from 'axios';

const KEYWORDS = [
  'convertible note',
  'insider buying',
  'share repurchase',
  'going concern',
  'material weakness',
  'revenue growth',
  'capacity expansion',
  'customer concentration',
  'executive departure',
  'litigation',
  'debt reduction',
  'margin expansion',
  'guidance raised',
  'new product',
  'contract won',
];

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
  let totalSignals = 0;
  let totalToxic = 0;
  
  const daysBack = initialScan ? 1095 : 1;
  console.log(`\n[${new Date().toISOString()}] 🚀 STARTING INVESTMENT SIGNAL SCAN (${daysBack} days)\n`);

  for (const keyword of KEYWORDS) {
    console.log(`🔍 Keyword: "${keyword}"`);
    try {
      const results = await searchEdgar(keyword, daysBack);
      if (results.length === 0) continue;

      for (const result of results) {
        totalFound++;
        
        const filingUrl = await getFilingUrl(result.cik, result.accessionNumber);
        const filingText = await getFilingText(filingUrl);
        if (!filingText) continue;

        // Get or create company
        let company: any = null;
        const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('cik', result.cik).single();
        
        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase.from('death_spiral_companies').insert([{ name: result.conm, cik: result.cik }]).select('id').single();
          if (newCompany.data) company = newCompany.data;
        }
        if (!company) continue;

        // Extract investment signals
        const signals = await extractSignals(filingText, result.conm);
        if (signals.length > 0) {
          totalSignals += signals.length;
          console.log(`  📊 ${result.conm}: ${signals.length} signals found`);
          
          for (const signal of signals) {
            await supabase.from('investment_signals').insert([{
              company_id: company.id,
              signal_type: signal.signalType,
              strength: signal.strength,
              evidence: signal.evidence,
              sentiment: signal.sentiment,
              filing_url: filingUrl,
              filing_date: new Date(result.filedAt).toISOString().split('T')[0],
            }]);
          }
        }

        // Check for toxic convertible
        const convertible = await extractToxicConvertible(filingText);
        if (convertible) {
          totalToxic++;
          console.log(`  ⚠️  TOXIC CONVERTIBLE: ${convertible.dealName} (${convertible.toxicityScore}/10)`);
          
          // Store convertible
          const noteResult = await supabase.from('death_spiral_notes').insert([{
            company_id: company.id,
            deal_name: convertible.dealName,
            total_principal: convertible.principal,
            toxicity_score: convertible.toxicityScore,
            red_flags: convertible.redFlags,
            green_flags: convertible.greenFlags,
            is_toxic: convertible.toxicityScore >= 6,
            filing_url: filingUrl,
            filing_date: new Date(result.filedAt).toISOString().split('T')[0],
          }]).select('id').single();

          if (noteResult.data) {
            for (const investor of convertible.investors) {
              await supabase.from('death_spiral_investors').insert([{
                note_id: noteResult.data.id,
                investor_name: investor.name,
                principal: investor.principal || convertible.principal,
              }]);
            }
          }
        }
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Error:`, error);
    }
  }

  console.log(`\n[${new Date().toISOString()}] ✅ SCAN COMPLETE`);
  console.log(`📈 Filings analyzed: ${totalFound}`);
  console.log(`📊 Investment signals found: ${totalSignals}`);
  console.log(`⚠️  Toxic convertibles found: ${totalToxic}\n`);
}

if (require.main === module) {
  const initialScan = process.argv[2] === 'initial';
  runDailyEdgarScan(initialScan).catch(console.error);
}
