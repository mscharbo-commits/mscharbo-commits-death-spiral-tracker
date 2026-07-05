import { getCompanyFilings } from '../lib/finnhub';
import { extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';
import axios from 'axios';

const TICKERS = ['ABVC', 'ONMD', 'RCAT', 'SOAR', 'HUBC', 'MULN', 'FFIE', 'NVOS', 'GFAI', 'CYN'];

async function getFilingText(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { timeout: 15000 });
    return response.data;
  } catch (error) {
    return null;
  }
}

function hasConvertible(text: string): boolean {
  return text.toLowerCase().includes('convertible');
}

export async function runDailyEdgarScan(initialScan: boolean = false) {
  const supabase = createClient();
  let totalFound = 0;
  let convertibleMentions = 0;
  let totalHighRisk = 0;
  
  console.log(`\n[${new Date().toISOString()}] 🚀 SCREENING CONVERTIBLE SECURITIES\n`);

  for (const ticker of TICKERS) {
    console.log(`📊 ${ticker}`);
    try {
      const filings = await getCompanyFilings(ticker);
      
      for (const filing of filings) {
        if (!filing.filingUrl && !filing.url) continue;
        
        totalFound++;
        const filingUrl = filing.filingUrl || filing.url || '';
        const filingText = await getFilingText(filingUrl);
        if (!filingText) continue;

        // STAGE 1: Just check if "convertible" appears
        if (!hasConvertible(filingText)) continue;

        convertibleMentions++;
        console.log(`  🔍 Convertible mention found`);

        // STAGE 2: Claude analyzes for risk
        let company: any = null;
        const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('name', ticker).single();
        
        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase.from('death_spiral_companies').insert([{ name: ticker, cik: filing.cik || '' }]).select('id').single();
          if (newCompany.data) company = newCompany.data;
        }
        if (!company) continue;

        const convertible = await extractToxicConvertible(filingText);
        if (convertible) {
          totalHighRisk++;
          console.log(`  ⚠️  HIGH-RISK: ${convertible.dealName} (${convertible.toxicityScore}/10)`);
          
          const noteResult = await supabase.from('death_spiral_notes').insert([{
            company_id: company.id,
            deal_name: convertible.dealName,
            total_principal: convertible.principal,
            toxicity_score: convertible.toxicityScore,
            red_flags: convertible.redFlags,
            green_flags: convertible.greenFlags,
            is_toxic: convertible.toxicityScore >= 6,
            filing_url: filingUrl,
            filing_date: filing.filingDate || new Date().toISOString().split('T')[0],
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
  console.log(`📊 Filings scanned: ${totalFound}`);
  console.log(`🔍 Contains "convertible": ${convertibleMentions}`);
  console.log(`⚠️  HIGH-RISK SECURITIES: ${totalHighRisk}\n`);
}

if (require.main === module) {
  runDailyEdgarScan().catch(console.error);
}
