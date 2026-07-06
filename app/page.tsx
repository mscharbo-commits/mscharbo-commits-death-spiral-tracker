import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Note {
  id: string;
  note_holder: string;
  principal: number;
  toxicity_score: number;
  red_flags: string[];
  green_flags: string[];
  is_toxic: boolean;
  filing_url: string;
  filing_date: string;
}

async function getNotes() {
  try {
    const { data, error } = await supabase
      .from('death_spiral_notes')
      .select(`id, note_holder, principal, toxicity_score, red_flags, green_flags, is_toxic, filing_date, filing_url`)
      .order('toxicity_score', { ascending: false })
      .limit(30);
    if (error) throw error;
    return data as Note[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

function getToxicityColor(score: number) {
  if (score >= 8) return 'bg-red-900 text-red-100';
  if (score >= 6) return 'bg-orange-900 text-orange-100';
  if (score >= 4) return 'bg-yellow-900 text-yellow-100';
  return 'bg-green-900 text-green-100';
}

function getToxicityEmoji(score: number) {
  if (score >= 8) return '🔴';
  if (score >= 6) return '🟠';
  if (score >= 4) return '🟡';
  return '🟢';
}

export default async function Home() {
  const notes = await getNotes();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-black border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Convertible Securities Analyzer</h1>
              <p className="text-slate-400 text-sm mt-1">High-risk monitoring from SEC filings</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-400">{notes.filter(n => n.is_toxic).length}</div>
              <div className="text-sm text-slate-400">High-Risk Deals</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {notes.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No deals found.</p>
            <p className="text-slate-500 text-sm mt-2">First crawler run at 8 PM UTC daily.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Deal</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold text-sm">Principal</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-semibold text-sm">Risk Score</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Red Flags</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Green Flags</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold text-sm">Filed</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => (
                  <tr key={note.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-medium">
                      <a href={note.filing_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline">
                        {note.note_holder}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">${(note.principal / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded font-bold ${getToxicityColor(note.toxicity_score)}`}>
                        {getToxicityEmoji(note.toxicity_score)} {note.toxicity_score}/10
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {note.red_flags?.slice(0, 2).map((flag, i) => (
                          <span key={i} className="bg-red-900/30 px-2 py-1 rounded text-red-300">{flag}</span>
                        ))}
                        {note.red_flags?.length > 2 && <span className="text-red-300">+{note.red_flags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {note.green_flags?.slice(0, 2).map((flag, i) => (
                          <span key={i} className="bg-green-900/30 px-2 py-1 rounded text-green-300">{flag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{new Date(note.filing_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
