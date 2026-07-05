import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Note {
  id: string;
  deal_name: string;
  total_principal: number;
  no_floor: boolean;
  make_whole: boolean;
  shares_registered: boolean;
  registration_rights: boolean;
  filing_date: string;
  filing_url: string;
  company: { name: string };
  investors: Array<{ investor_name: string }>;
}

async function getNotes() {
  try {
    const { data, error } = await supabase
      .from('death_spiral_notes')
      .select(`id, deal_name, total_principal, no_floor, make_whole, shares_registered, registration_rights, filing_date, filing_url, company:death_spiral_companies(name), investors:death_spiral_investors(investor_name)`)
      .order('filing_date', { ascending: false })
      .limit(30);
    if (error) throw error;
    return data as Note[];
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
}

export default async function Home() {
  const notes = await getNotes();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-black border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Death Spiral Tracker</h1>
              <p className="text-slate-400 text-sm mt-1">Real-time monitoring of toxic convertible notes from SEC EDGAR filings</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">{notes.length}</div>
              <div className="text-sm text-slate-400">Deals Found</div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {notes.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No deals found yet.</p>
            <p className="text-slate-500 text-sm mt-2">First crawler run scheduled for 8 PM UTC daily.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Company</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Deal</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Investors</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold text-sm">Principal</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-semibold text-sm">Registered</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-semibold text-sm">Reg Rights</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-semibold text-sm">No Floor</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-semibold text-sm">Make Whole</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Filed</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => (
                  <tr key={note.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <a href={note.filing_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline">
                        {note.company.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{note.deal_name}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {note.investors.slice(0, 2).map((inv, i) => (
                          <span key={i} className="bg-slate-700 px-2 py-1 rounded text-xs">{inv.investor_name.split(' ')[0]}</span>
                        ))}
                        {note.investors.length > 2 && <span className="bg-slate-700 px-2 py-1 rounded text-xs">+{note.investors.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">${(note.total_principal / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-center">{note.shares_registered ? <span className="text-green-400">✅</span> : <span className="text-red-400">❌</span>}</td>
                    <td className="px-4 py-3 text-center">{note.registration_rights ? <span className="text-green-400">✅</span> : <span className="text-slate-500">—</span>}</td>
                    <td className="px-4 py-3 text-center">{note.no_floor ? <span className="text-red-500 font-bold">⚠️</span> : <span className="text-green-400">✅</span>}</td>
                    <td className="px-4 py-3 text-center">{note.make_whole ? <span className="text-red-500 font-bold">⚠️</span> : <span className="text-slate-500">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{new Date(note.filing_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 mt-8 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
          <div><div className="font-semibold text-white mb-1">No Floor</div><p>No conversion price floor = toxic dilution risk</p></div>
          <div><div className="font-semibold text-white mb-1">Make Whole</div><p>Investor gets extra shares if not converted = dilution</p></div>
          <div><div className="font-semibold text-white mb-1">Registration</div><p>Shares registered = faster conversion = more dilution</p></div>
        </div>
      </div>
    </div>
  );
}
