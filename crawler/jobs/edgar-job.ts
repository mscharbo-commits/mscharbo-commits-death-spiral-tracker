import { createClient } from '@supabase/supabase-js';
import { generateSyntheticConvertibles, calculateToxicityScore } from './test-convertible-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function runEDGARCrawler() {
  console.log(`\n[${new Date().toISOString()}] Starting EDGAR crawler...\n`);
  console.log(`📊 Generating synthetic convertible test data...\n`);
  
  const syntheticData = generateSyntheticConvertibles();

  for (const synth of syntheticData) {
    const toxScore = calculateToxicityScore(synth);
    
    console.log(`   ${synth.dealName}`);
    console.log(`     Principal: $${(synth.principal / 1000000).toFixed(0)}M`);
    console.log(`     Toxicity: ${toxScore}/10 ${toxScore >= 8 ? '🔴' : toxScore >= 6 ? '🟠' : toxScore >= 4 ? '🟡' : '🟢'}`);
    console.log(`     Conversion: ${synth.conversionPrice ? '$' + synth.conversionPrice : 'NONE (RED FLAG)'}`);
    console.log(`     Warrants: ${synth.warrantsIncluded ? 'YES (RED FLAG)' : 'No'}`);
    console.log();

    if (supabase) {
      await supabase.from('death_spiral_conversions').insert({
        company_id: synth.ticker,
        deal_name: synth.dealName,
        principal: synth.principal,
        conversion_price: synth.conversionPrice,
        conversion_rate_type: synth.conversionRate,
        anti_dilution_type: synth.antiDilutionClause,
        warrant_coverage: synth.warrantsIncluded,
        discount_percent: synth.discountPercent,
        toxicity_score: toxScore,
        created_at: new Date().toISOString(),
      });
    }
  }

  console.log(`✨ Done at ${new Date().toISOString()}\n`);
}

if (require.main === module) {
  runEDGARCrawler().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

export { runEDGARCrawler };
