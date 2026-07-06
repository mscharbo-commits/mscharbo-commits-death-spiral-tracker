import { createClient } from '../lib/supabase';

async function seedDeals() {
  const supabase = createClient();
  
  console.log('\n🌱 Clearing old data...\n');
  
  await supabase.from('death_spiral_investors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('death_spiral_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('death_spiral_companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('✓ Cleared\n🌱 Seeding test deals...\n');

  const testDeals = [
    {
      companyName: 'Palantir Technologies',
      cik: '0001321655',
      noteHolder: 'Founders Fund / In-Q-Tel',
      principal: 500000,
      toxicityScore: 7,
      redFlags: ['no floor', 'variable conversion rate', 'warrant coverage'],
      greenFlags: ['valuation cap'],
      filingUrl: 'https://www.sec.gov/example1'
    },
    {
      companyName: 'Better.com',
      cik: '0001827788',
      noteHolder: 'SoftBank Vision Fund / Goldman Sachs',
      principal: 2000000,
      toxicityScore: 8,
      redFlags: ['no floor', 'full ratchet anti-dilution', 'make-whole provision', 'warrant coverage 50%'],
      greenFlags: [],
      filingUrl: 'https://www.sec.gov/example2'
    },
    {
      companyName: 'WeWork',
      cik: '0001616707',
      noteHolder: 'SoftBank / JP Morgan',
      principal: 5000000,
      toxicityScore: 9,
      redFlags: ['no floor', 'variable conversion', 'multiple liquidation preference', 'control rights'],
      greenFlags: [],
      filingUrl: 'https://www.sec.gov/example3'
    }
  ];

  for (const deal of testDeals) {
    try {
      const { data: company, error: companyError } = await supabase
        .from('death_spiral_companies')
        .insert([{ name: deal.companyName, cik: deal.cik }])
        .select('id')
        .single();

      if (companyError) {
        console.error(`❌ ${deal.companyName}:`, companyError.message);
        continue;
      }

      const { data: note, error: noteError } = await supabase
        .from('death_spiral_notes')
        .insert([{
          company_id: company.id,
          note_holder: deal.noteHolder,
          principal: deal.principal,
          toxicity_score: deal.toxicityScore,
          red_flags: deal.redFlags,
          green_flags: deal.greenFlags,
          is_toxic: deal.toxicityScore >= 6,
          filing_url: deal.filingUrl,
          filing_date: new Date().toISOString().split('T')[0],
        }])
        .select('id')
        .single();

      if (noteError) {
        console.error(`❌ ${deal.companyName}:`, noteError.message);
        continue;
      }

      console.log(`✅ ${deal.companyName}`);
    } catch (error) {
      console.error(`❌ ${deal.companyName}:`, error);
    }
  }

  console.log('\n✅ Seeding complete!\n');
}

seedDeals().catch(console.error);
