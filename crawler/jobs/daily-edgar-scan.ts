import { scrapeEdgarSearch } from '../lib/edgar';
import { extractSignals, extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';
import axios from 'axios';

const KEYWORDS = [
  'convertible note',
  'convertible loan',
  'insider buying',
  'share repurchase',
  'going concern',
  'material weakness',
];

async function getFilingText(filingUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(filingUrl, { timeout: 15000 });
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
  
  console.log(`\n[${new Date().toISOString()}] 🚀 SCRAPING SEC EDGAR\n`);

  for (const keyword of KEYWORDS) {
    console.log(`🔍 "${keyword}"`);
    try {
      const filings = await scrapeEdgarSearch(keyword);

      for (const filing of filings) {
        totalFound++;

        const filingText = await getFilingText(filing.link);
        if (!filingText) continue;

        // Get or create company
        let company: any = null;
        const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('name', filing.conm).single();
        
        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase.from('death_spiral_companies').insert([{ name: filing.conm, cik: '' }]).select('id').single();
          if (newCompany.data) company = newCompany.data;
        }
        if (!company) continue;

        // Extract signals
        const signals = await extractSignals(filingText, filing.conm);
        if (signals.length > 0) {
          totalSignals += signals.length;
          console.log(`  📊 ${filing.conm} [${filing.form}]: ${signals.length} signals`);
          
          for (const signal of signals) {
            await supabase.from('investment_signals').insert([{
              company_id: company.id,
              signal_type: signal.signalType,
              strength: signal.strength,
              evidence: signal.evidence,
              sentiment: signal.sentiment,
              filing_url: filing.link,
              filing_date: filing.filedAt,
            }]);
          }
        }

        // Check for toxic convertible
        const convertible = await extractToxicConvertible(filingText);
        if (convertible) {
          totalToxic++;
          console.log(`  ⚠️  TOXIC: ${convertible.dealName} (${convertible.toxicityScore}/10)`);
          
          const noteResult = await supabase.from('death_spiral_notes').insert([{
            company_id: company.id,
            deal_name: convertible.dealName,
            total_principal: convertible.principal,
            toxicity_score: convertible.toxicityScore,
            red_flags: convertible.redFlags,
            green_flags: convertible.greenFlags,
            is_toxic: convertible.toxicityScore >= 6,
            filing_url: filing.link,
            filing_date: filing.filedAt,
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

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error:`, error);
    }
  }

  console.log(`\n[${new Date().toISOString()}] ✅ COMPLETE`);
  console.log(`📈 Filings: ${totalFound}`);
  console.log(`📊 Signals: ${totalSignals}`);
  console.log(`⚠️  Toxic: ${totalToxic}\n`);
}

if (require.main === module) {
  runDailyEdgarScan().catch(console.error);
}
