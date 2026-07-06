import { createClient } from '../lib/supabase';

async function seedDeals() {
  const supabase = createClient();
  
  console.log('\n🌱 Seeding test deals...\n');

  const testDeals = [
    {
      companyName: 'Palantir Technologies',
      dealName: 'Series A Convertible Note - 2010',
      principal: 500000,
      investors: [
        { name: 'Founders Fund', principal: 250000 },
        { name: 'In-Q-Tel', principal: 250000 }
      ],
      toxicityScore: 7,
      redFlags: ['no floor', 'variable conversion rate', 'warrant coverage'],
      greenFlags: ['valuation cap'],
      filingUrl: 'https://www.sec.gov/example1'
    },
    {
      companyName: 'Better.com',
      dealName: 'Convertible Note Series B - 2021',
      principal: 2000000,
      investors: [
        { name: 'SoftBank Vision Fund', principal: 1200000 },
        { name: 'Goldman Sachs', principal: 800000 }
      ],
      toxicityScore: 8,
      redFlags: ['no floor', 'full ratchet anti-dilution', 'make-whole provision', 'warrant coverage 50%'],
      greenFlags: [],
      filingUrl: 'https://www.sec.gov/example2'
    },
    {
      companyName: 'WeWork',
      dealName: 'Convertible Debt - 2019',
      principal: 5000000,
      investors: [
        { name: 'Masayoshi Son (SoftBank)', principal: 3000000 },
        { name: 'JP Morgan', principal: 2000000 }
      ],
      toxicityScore: 9,
      redFlags: ['no floor', 'variable conversion', 'multiple liquidation preference', 'control rights', 'mandatory redemption < 2 years'],
      greenFlags: [],
      filingUrl: 'https://www.sec.gov/example3'
    }
  ];

  for (const deal of testDeals) {
    try {
      // Insert company
      let company: any = null;
      const existing = await supabase.from('death_spiral_companies').select('id').eq('name', deal.companyName).single();
      
      if (existing.data) {
        company = existing.data;
      } else {
        const newCompany = await supabase.from('death_spiral_companies').insert([{ name: deal.companyName, cik: '' }]).select('id').single();
        company = newCompany.data;
      }

      if (!company) continue;

      // Insert note
      const noteResult = await supabase.from('death_spiral_notes').insert([{
        company_id: company.id,
        deal_name: deal.dealName,
        total_principal: deal.principal,
        toxicity_score: deal.toxicityScore,
        red_flags: deal.redFlags,
        green_flags: deal.greenFlags,
        is_toxic: deal.toxicityScore >= 6,
        filing_url: deal.filingUrl,
        filing_date: new Date().toISOString().split('T')[0],
      }]).select('id').single();

      if (!noteResult.data) continue;

      // Insert investors
      for (const investor of deal.investors) {
        await supabase.from('death_spiral_investors').insert([{
          note_id: noteResult.data.id,
          investor_name: investor.name,
          principal: investor.principal || deal.principal,
        }]);
      }

      console.log(`✅ ${deal.companyName} - ${deal.dealName}`);
    } catch (error) {
      console.error(`❌ Failed to insert ${deal.companyName}:`, error);
    }
  }

  console.log('\n✅ Seeding complete!\n');
}

seedDeals().catch(console.error);
