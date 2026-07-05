import { getFeedingsFromRSS } from '../lib/edgar';
import { extractSignals, extractToxicConvertible } from '../lib/signals';
import { createClient } from '../lib/supabase';
import axios from 'axios';

async function extractFilingUrl(description: string): Promise<string | null> {
  // RSS entries have URLs in description
  const match = description.match(/href="([^"]+)"/);
  return match ? match[1] : null;
}

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
  
  console.log(`\n[${new Date().toISOString()}] 🚀 INVESTMENT SIGNAL SCAN (RSS FEEDS)\n`);

  const filings = await getFeedingsFromRSS();
  console.log(`Found ${filings.length} recent filings from SEC RSS\n`);

  for (const filing of filings) {
    const title = filing.title?.[0] || '';
    const description = filing.description?.[0] || '';
    
    // Extract company and CIK from title
    const titleMatch = title.match(/(.+?) \((.+?)\) (10-K|10-Q|8-K|S-1)/);
    if (!titleMatch) continue;
    
    const companyName = titleMatch[1];
    const cik = titleMatch[2];
    const formType = titleMatch[3];

    totalFound++;

    const filingUrl = await extractFilingUrl(description);
    if (!filingUrl) continue;

    const filingText = await getFilingText(filingUrl);
    if (!filingText) {
      console.log(`  ✗ ${companyName} - couldn't fetch`);
      continue;
    }

    // Get or create company
    let company: any = null;
    const existingCompany = await supabase.from('death_spiral_companies').select('id').eq('cik', cik).single();
    
    if (existingCompany.data) {
      company = existingCompany.data;
    } else {
      const newCompany = await supabase.from('death_spiral_companies').insert([{ name: companyName, cik }]).select('id').single();
      if (newCompany.data) company = newCompany.data;
    }
    if (!company) continue;

    // Extract signals
    const signals = await extractSignals(filingText, companyName);
    if (signals.length > 0) {
      totalSignals += signals.length;
      console.log(`  📊 ${companyName} [${formType}]: ${signals.length} signals`);
      
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

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n[${new Date().toISOString()}] ✅ SCAN COMPLETE`);
  console.log(`📈 Filings analyzed: ${totalFound}`);
  console.log(`📊 Investment signals: ${totalSignals}`);
  console.log(`⚠️  Toxic convertibles: ${totalToxic}\n`);
}

if (require.main === module) {
  runDailyEdgarScan().catch(console.error);
}
