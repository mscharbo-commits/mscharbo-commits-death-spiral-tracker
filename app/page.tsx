'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data } = await supabase
          .from('death_spiral_notes')
          .select('*')
          .gte('filing_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('filing_date', { ascending: false });

        setDeals(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Death Spiral Tracker</h1>
      <p>Real-time monitoring of toxic convertible notes from SEC EDGAR filings</p>
      {loading ? (
        <p>Loading...</p>
      ) : deals.length === 0 ? (
        <p>No deals found. First crawler run at 8 PM UTC daily.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Note Holder</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Principal</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>No Floor</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Filed</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal: any) => (
              <tr key={deal.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{deal.note_holder}</td>
                <td style={{ padding: '10px' }}>${(deal.principal / 1000000).toFixed(1)}M</td>
                <td style={{ padding: '10px' }}>{deal.no_floor ? '✅' : '❌'}</td>
                <td style={{ padding: '10px' }}>{new Date(deal.filing_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
