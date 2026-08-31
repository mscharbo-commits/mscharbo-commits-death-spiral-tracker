import { createClient } from '@supabase/supabase-js';
import { EDGARFetcher, EDGARFiling } from './edgar-fetcher';
import { TOXIC_CONVERTIBLE_TEST_COMPANIES, generateSyntheticConvertibles, calculateToxicityScore } from './test-data-generator';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function runEDGARCrawler() {
  console.log(`[${new Date().toISOString()}] Starting EDGAR crawler...`);
  const fetcher = new EDGARFetcher();
  console.log(`Processing ${TOXIC_CONVERTIBLE_TEST_COMPANIES.length} test companies...`);
  for (const company of TOXIC_CONVERTIBLE_TEST_COMPANIES.slice(0, 3)) {
    console.log(`\n📝 Processing ${company.name} (${company.ticker})`);
    const filing = company.recentFilings[0];
    if (!filing) {
      console.log(`  ⚠️  No filings found for ${company.name}`);
      continue;
    }
    const edgarFiling: EDGARFiling = {
      cik: company.cik,
      companyName: company.name,
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      formType: filing.formType,
      filePath: filing.accessionNumber.replace(/-/g, ''),
    };
    const result = await fetcher.processFiling(edgarFiling);
    if (result.success && result.filing.fullText) {
      console.log(`  ✅ Successfully fetched ${company.name}`);
      await supabase.from('death_spiral_companies').upsert({
        cik: company.cik,
        name: company.name,
        ticker: company.ticker,
        sector: company.sector,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'cik' });
      if (result.filing.extractedSections?.capitalStructure) {
        await supabase.from('death_spiral_notes').insert({
          company_id: company.cik,
          note_holder: 'SEC Filing',
          principal: 0,
          filed_date: filing.filingDate,
          filing_type: filing.formType,
          content: result.filing.extractedSections.capitalStructure.substring(0, 10000),
          created_at: new Date().toISOString(),
        });
      }
      console.log(`  💾 Saved to Supabase`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log(`\n📊 Generating synthetic convertible test data...`);
  const syntheticData = generateSyntheticConvertibles();
  for (const synth of syntheticData) {
    const toxScore = calculateToxicityScore(synth);
    const { data: existingCompany } = await supabase.from('death_spiral_companies').select('id').eq('ticker', synth.ticker).single();
    if (!existingCompany) {
      await supabase.from('death_spiral_companies').insert({
        cik: 'SYNTHETIC',
        name: synth.companyName,
        ticker: synth.ticker,
        sector: 'Mixed',
        last_updated: new Date().toISOString(),
      });
    }
    const { error } = await supabase.from('death_spiral_conversions').insert({
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
    if (!error) console.log(`  ✅ Saved: ${synth.dealName} (Toxicity: ${toxScore}/10)`);
  }
  console.log(`\n✨ EDGAR crawler completed at ${new Date().toISOString()}`);
}
if (require.main === module) {
  runEDGARCrawler().then(() => {
    console.log('✅ Crawler finished successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Crawler failed:', error);
    process.exit(1);
  });
}
export { runEDGARCrawler };
