import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

export interface Investor {
  name: string;
  principal?: number;
  ownershipPercentage?: number;
  beneficialOwnershipCap?: number;
}

export interface DeathSpiralTerms {
  isDeathSpiral: boolean;
  dealName: string;
  noteHolders: Investor[];
  principal: number;
  noFloor: boolean;
  makeWhole: boolean;
  sharesRegistered: boolean;
  registrationRights: boolean;
  toxicityScore: number;
  redFlags: string[];
  greenFlags: string[];
  conversion_rate?: string;
  discount?: number;
  warrantsPercentage?: number;
  antiDilution?: string;
  liquidationPreference?: number;
  mandatoryRedemptionYears?: number;
}

export async function extractDeathSpiralTerms(filingText: string, companyName: string): Promise<DeathSpiralTerms | null> {
  const prompt = `You are analyzing a convertible note filing. Extract terms and score toxicity.

FILING TEXT:
${filingText.substring(0, 10000)}

RED FLAGS (1 point each):
- Variable conversion price (lookback formula)
- No valuation cap
- Full-ratchet anti-dilution
- Excessive discount (40%+ to next round)
- Mandatory redemption < 5 years
- Warrant coverage 50%+
- Penalty interest 20%+
- No conversion price floor
- Multiple liquidation preference (2x+)
- Control/veto rights

GREEN FLAGS (subtract 0.5 each):
- Fixed discount 10-20%
- Valuation cap present
- No mandatory redemption before 5+ years
- Weighted average anti-dilution
- 1x liquidation preference
- Limited protective provisions

Return ONLY JSON:
{
  "isDeathSpiral": boolean,
  "dealName": "string",
  "noteHolders": [{"name": "string", "principal": number}],
  "principal": number,
  "noFloor": boolean,
  "makeWhole": boolean,
  "sharesRegistered": boolean,
  "registrationRights": boolean,
  "discount": number (percentage),
  "warrantsPercentage": number,
  "antiDilution": "string (full-ratchet, weighted-average, none)",
  "liquidationPreference": number (1x, 2x, etc),
  "mandatoryRedemptionYears": number,
  "redFlags": ["list of red flags found"],
  "greenFlags": ["list of green flags found"],
  "toxicityScore": number (1-10)
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{role: 'user', content: prompt}],
    });
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);
    if (!parsed.isDeathSpiral || !parsed.noteHolders) return null;
    return parsed;
  } catch (error) {
    console.error('Failed:', error);
    return null;
  }
}

export interface ConversionEvent {
  investorName: string;
  conversionDate: string;
  amountConverted: number;
  sharesIssued: number;
  conversionPrice: number;
}

export async function extractConversion8K(filingText: string): Promise<ConversionEvent[] | null> {
  const prompt = `Extract conversion events from 8-K.
FILING TEXT: ${filingText.substring(0, 8000)}
Return JSON with conversions array.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{role: 'user', content: prompt}],
    });
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);
    return parsed.conversions || null;
  } catch (error) {
    console.error('Failed:', error);
    return null;
  }
}
