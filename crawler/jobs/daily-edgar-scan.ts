import { getCompanyFilings } from '../lib/finnhub';
import { extractSignals, extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';
import axios from 'axios';

// Tickers ChatGPT identified with known toxic converts
const TICKERS = ['ABVC', 'ONMD', 'RCAT', 'SOAR', 'HUBC', 'MULN', 'FFIE', 'NVOS', 'GFAI', 'CYN'];

// Exact phrases from SEC filings
const TOXIC_PHRASES = [
  'no minimum conversion price',
  'variable conversion price',
  'lowest trading days',
  'floating-price financing',
  'multiple restructuring',
  'dilutive convertibles'
];

async function getFilingText(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { timeout: 15000 });
    return response.data;
  } catch (error) {
    return null;
  }
}

function hasToxicPhrase(text: string): boolean {
  const lowerText = text.toLowerCase();
  return TOXIC_PHRASES.some(phrase => lowerText.includes(phrase));
}

export async function runDailyEdgarScan(initialScan: boolean = false) {
  const supabase = createClient();
  let totalFound = 0;
  let toxicMentions = 0;
  let totalToxic = 0;
  
  console.log(`\n[${new Date().toISOString()}] 🚀 SCREENING KNOWN TOXIC TICKERS\n`);

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

        // Stage 1: Filter for toxic phrases
        if (!hasToxicPhrase(filingText)) continue;

        toxicMentions++;
        console.log(`  🔍 Found toxic phrase in ${filing.form}`);

        // Get or create company
        let company: any = null;
        const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('name', ticker).single();
        
        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase.from('death_spiral_companies').insert([{ name: ticker, cik: filing.cik || '' }]).select('id').single();
          if (newCompany.data) company = newCompany.data;
        }
        if (!company) continue;

        // Stage 2: Deep analysis with Claude
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
  console.log(`🔍 Toxic phrases found: ${toxicMentions}`);
  console.log(`⚠️  TOXIC CONVERTIBLES: ${totalToxic}\n`);
}

if (require.main === module) {
  runDailyEdgarScan().catch(console.error);
}
