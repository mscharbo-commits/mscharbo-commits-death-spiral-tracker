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
  conversion_rate?: string;
  truUp?: boolean;
  ratchetMultiplier?: number;
  lookbackDays?: number;
  warrants?: boolean;
}

export async function extractDeathSpiralTerms(filingText: string, companyName: string): Promise<DeathSpiralTerms | null> {
  const prompt = `Extract death spiral convertible terms from this SEC filing. Focus on:
- Registration status of underlying shares
- Registration rights provisions
- Multiple investors and their terms

FILING TEXT:
${filingText.substring(0, 8000)}

Return ONLY JSON:
{
  "isDeathSpiral": boolean,
  "dealName": "string",
  "noteHolders": [{"name": "string", "principal": number, "ownershipPercentage": number}],
  "principal": number,
  "noFloor": boolean,
  "makeWhole": boolean,
  "sharesRegistered": boolean (are underlying shares already registered?),
  "registrationRights": boolean (does convertible include registration rights?),
  "conversionRate": "string",
  "truUp": boolean,
  "ratchetMultiplier": number,
  "lookbackDays": number,
  "warrants": boolean
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
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
  const prompt = `Extract conversion events from 8-K. Return JSON with conversions array including investorName, conversionDate (YYYY-MM-DD), amountConverted, sharesIssued, conversionPrice.
FILING TEXT: ${filingText.substring(0, 8000)}`;

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
