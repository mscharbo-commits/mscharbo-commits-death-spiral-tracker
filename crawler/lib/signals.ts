import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

export interface InvestmentSignal {
  signalType: string; // "insider_buying", "revenue_acceleration", etc
  strength: number; // 1-10
  evidence: string; // exact quote from filing
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export async function extractSignals(filingText: string, companyName: string): Promise<InvestmentSignal[]> {
  const prompt = `You are analyzing an SEC filing for investment signals. Extract ALL relevant signals.

FILING TEXT (first 10000 chars):
${filingText.substring(0, 10000)}

SIGNALS TO DETECT:
Bullish: insider_buying, buyback_increases, revenue_acceleration, margin_expansion, raised_guidance, contract_wins, capacity_expansion, new_products, customer_additions, debt_reduction
Bearish: share_dilution, customer_concentration, going_concern, material_weakness, executive_departures, litigation_increases, regulatory_risks, ai_spending_surge, capex_acceleration
Neutral: institutional_ownership_changes

Return ONLY JSON array:
[
  {
    "signalType": "insider_buying",
    "strength": 8,
    "evidence": "Officers purchased 500,000 shares at \$45",
    "sentiment": "bullish"
  }
]

Be aggressive finding signals. Return minimum 1, maximum 10 signals per filing.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{role: 'user', content: prompt}],
    });
    
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    const signals = JSON.parse(cleanJson);
    
    return Array.isArray(signals) ? signals : [];
  } catch (error) {
    console.error('Signal extraction failed:', error);
    return [];
  }
}

export interface ToxicConvertible {
  dealName: string;
  investors: Array<{name: string; principal: number}>;
  principal: number;
  toxicityScore: number;
  redFlags: string[];
  greenFlags: string[];
}

export async function extractToxicConvertible(filingText: string): Promise<ToxicConvertible | null> {
  const prompt = `Extract toxic convertible note details. Return JSON:
{
  "isConvertible": boolean,
  "dealName": "string",
  "investors": [{"name": "string", "principal": number}],
  "principal": number,
  "toxicityScore": 1-10,
  "redFlags": ["no floor", "variable rate", ...],
  "greenFlags": ["valuation cap", ...]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{role: 'user', content: prompt}],
    });
    
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);
    
    if (!parsed.isConvertible) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}
