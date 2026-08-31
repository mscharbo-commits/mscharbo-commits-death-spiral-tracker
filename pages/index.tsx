'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DeathSpiralDeal {
  id: string;
  company_name: string;
  ticker: string;
  deal_name: string;
  principal: number;
  conversion_price: number | null;
  conversion_rate_type: string;
  anti_dilution_type: string;
  warrant_coverage: boolean;
  discount_percent: number;
  toxicity_score: number;
  created_at: string;
}

export default function ConvertibleSecuritiesAnalyzer() {
  const [deals, setDeals] = useState<DeathSpiralDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  async function fetchDeals() {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      const { data, error: fetchError } = await supabase
        .from('death_spiral_deals')
        .select('*')
        .order('toxicity_score', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setDeals(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  }

  function getToxicityEmoji(score: number): string {
    if (score >= 8) return '🔴';
    if (score >= 6) return '🟠';
    if (score >= 4) return '🟡';
    return '🟢';
  }

  function getRedFlags(deal: DeathSpiralDeal): string[] {
    const flags = [];
    if (deal.conversion_price === null) flags.push('no floor');
    if (deal.conversion_rate_type === 'variable') flags.push('variable conversion');
    if (deal.anti_dilution_type === 'full-ratchet') flags.push('full ratchet anti-dilution');
    if (deal.warrant_coverage) flags.push('warrant coverage');
    if (deal.discount_percent > 40) flags.push('extreme discount');
    return flags;
  }

  function getGreenFlags(deal: DeathSpiralDeal): string[] {
    const flags = [];
    if (deal.conversion_price !== null && deal.conversion_price > 1) flags.push('price floor');
    if (deal.anti_dilution_type === 'weighted-average') flags.push('weighted average');
    if (deal.conversion_rate_type === 'fixed') flags.push('fixed rate');
    if (!deal.warrant_coverage) flags.push('no warrants');
    return flags;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Convertible Securities Analyzer</h1>
        <p className="text-gray-400 text-lg">High-risk monitoring from SEC filings</p>
      </div>

      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-3 gap-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-400 text-sm font-semibold">CRITICAL (9-10)</div>
          <div className="text-3xl font-bold text-red-400">{deals.filter(d => d.toxicity_score >= 9).length}</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <div className="text-orange-400 text-sm font-semibold">HIGH (6-8)</div>
          <div className="text-3xl font-bold text-orange-400">{deals.filter(d => d.toxicity_score >= 6 && d.toxicity_score < 9).length}</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-semibold">Total Deals</div>
          <div className="text-3xl font-bold text-blue-400">{deals.length}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-900/50 border-b border-slate-700 font-semibold text-gray-300 text-sm">
            <div className="col-span-2">Deal</div>
            <div className="col-span-1">Principal</div>
            <div className="col-span-1">Risk</div>
            <div className="col-span-4">Red Flags</div>
            <div className="col-span-2">Green Flags</div>
            <div className="col-span-2">Filed</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading deals...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">Error: {error}</div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No death spiral deals found.</div>
          ) : (
            deals.map((deal, idx) => (
              <div key={deal.id} className={`grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 hover:bg-slate-700/20 transition ${idx % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                <div className="col-span-2">
                  <div className="font-semibold text-white truncate">{deal.deal_name}</div>
                  <div className="text-xs text-gray-400">{deal.ticker}</div>
                </div>
                <div className="col-span-1 text-white font-mono">${(deal.principal / 1000000).toFixed(1)}M</div>
                <div className="col-span-1 text-center">
                  <div className="text-xl">{getToxicityEmoji(deal.toxicity_score)}</div>
                  <div className="text-sm font-semibold text-white">{deal.toxicity_score}/10</div>
                </div>
                <div className="col-span-4">
                  <div className="flex flex-wrap gap-1">
                    {getRedFlags(deal).map((flag, i) => (
                      <span key={i} className="bg-red-900/40 text-red-300 text-xs px-2 py-1 rounded border border-red-700/50">{flag}</span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {getGreenFlags(deal).map((flag, i) => (
                      <span key={i} className="bg-green-900/40 text-green-300 text-xs px-2 py-1 rounded border border-green-700/50">{flag}</span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 text-gray-400 text-sm">{new Date(deal.created_at).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
