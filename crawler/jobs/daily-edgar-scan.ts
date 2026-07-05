import { getCompanyFilings } from '../lib/polygon';
import { extractSignals, extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';
import axios from 'axios';

// Use YOUR PulseStock tickers that are already filtered
const TICKERS = [
  'NVDA', 'TSLA', 'MSFT', 'AAPL', 'AMZN',
  'GOOGL', 'META', 'NFLX', 'AMD', 'INTC',
  'PLTR', 'UPST', 'COIN', 'HOOD', 'ROKU'
];

async function getFilingText(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { timeout: 15000 });
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
  
  console.log(`\n[${new Date().toISOString()}] 🚀 SCANNING POLYGON FOR SIGNALS\n`);

  for (const ticker of TICKERS) {
    console.log(`📊 ${ticker}`);
    try {
      const filings = await getCompanyFilings(ticker);
      
      for (const filing of filings) {
        totalFound++;

        // Polygon gives us URLs to filing text
        const filingUrl = filing.filing_url || filing.url || '';
        if (!filingUrl) continue;

        const filingText = await getFilingText(filingUrl);
        if (!filingText) continue;

        // Get or create company
        let company: any = null;
        const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('name', ticker).single();
        
        if (existingCompany.data) {
          company = existingCompany.data;
        } else {
          const newCompany = await supabase.from('death_spiral_companies').insert([{ name: ticker, cik: '' }]).select('id').single();
          if (newCompany.data) company = newCompany.data;
        }
        if (!company) continue;

        // Extract signals
        const signals = await extractSignals(filingText, ticker);
        if (signals.length > 0) {
          totalSignals += signals.length;
          console.log(`  📈 ${signals.length} signals`);
          
          for (const signal of signals) {
            await supabase.from('investment_signals').insert([{
              company_id: company.id,
              signal_type: signal.signalType,
              strength: signal.strength,
              evidence: signal.evidence,
              sentiment: signal.sentiment,
              filing_url: filingUrl,
              filing_date: new Date().toISOString().split('T')[0],
            }]);
          }
        }

        // Check for toxic convertible
        const convertible = await extractToxicConvertible(filingText);
        if (convertible) {
          totalToxic++;
          console.log(`  ⚠️  ${convertible.dealName}`);
          
          const noteResult = await supabase.from('death_spiral_notes').insert([{
            company_id: company.id,
            deal_name: convertible.dealName,
            total_principal: convertible.principal,
            toxicity_score: convertible.toxicityScore,
            red_flags: convertible.redFlags,
            green_flags: convertible.greenFlags,
            is_toxic: convertible.toxicityScore >= 6,
            filing_url: filingUrl,
            filing_date: new Date().toISOString().split('T')[0],
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

      await new Promise((resolve) => setTimeout(resolve, 1000));
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
