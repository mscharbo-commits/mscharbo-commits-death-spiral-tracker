import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';
interface EDGARFiling {
  cik: string;
  companyName: string;
  accessionNumber: string;
  filingDate: string;
  formType: string;
  filePath: string;
  fullText?: string;
  extractedSections?: {
    businessDescription?: string;
    riskFactors?: string;
    securityHoldings?: string;
    capitalStructure?: string;
  };
}
interface FetchResult {
  filing: EDGARFiling;
  success: boolean;
  error?: string;
  toxicityIndicators?: {
    redFlags: string[];
    greenFlags: string[];
  };
}
class EDGARFetcher {
  private readonly baseUrl = 'https://www.sec.gov/Archives/edgar/data';
  private readonly requestDelay = 100;
  private lastRequestTime = 0;
  private padCIK(cik: string | number): string {
    return String(cik).padStart(10, '0');
  }
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await setTimeout(this.requestDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }
  async getFilingIndex(cik: string, accessionNumber: string): Promise<string | null> {
    await this.enforceRateLimit();
    const paddedCIK = this.padCIK(cik);
    const cleanAccession = accessionNumber.replace(/-/g, '');
    const indexUrl = `${this.baseUrl}/${paddedCIK}/${cleanAccession}/index.htm`;
    try {
      const response = await fetch(indexUrl, {
        headers: { 'User-Agent': 'Death-Spiral-Tracker/1.0' },
      });
      if (!response.ok) return null;
      const html = await response.text();
      const matches = html.match(/href="([^"]*?\.htm)"/gi) || [];
      if (matches.length > 0) {
        const firstFile = matches[0]?.replace(/href="|"/g, '');
        if (firstFile && !firstFile.includes('index')) {
          return `${this.baseUrl}/${paddedCIK}/${cleanAccession}/${firstFile}`;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error fetching index:`, error);
      return null;
    }
  }
  async getFullText(filingUrl: string): Promise<string | null> {
    await this.enforceRateLimit();
    try {
      const response = await fetch(filingUrl, {
        headers: { 'User-Agent': 'Death-Spiral-Tracker/1.0' },
      });
      if (!response.ok) return null;
      return await response.text();
    } catch (error) {
      console.error(`Error fetching filing:`, error);
      return null;
    }
  }
  extractRelevantSections(fullText: string, formType: string) {
    const sections: Record<string, string | undefined> = {};
    const businessMatch = fullText.match(/(?:Item 1\.|BUSINESS DESCRIPTION)([\s\S]{0,5000}?)(?:Item \d+\.|RISK|MANAGEMENT|$)/i);
    if (businessMatch) sections.businessDescription = businessMatch[1]?.trim();
    const riskMatch = fullText.match(/(?:Item 1A\.|RISK FACTORS?)([\s\S]{0,10000}?)(?:Item \d+\.|CAPITAL|LIQUIDITY|$)/i);
    if (riskMatch) sections.riskFactors = riskMatch[1]?.trim();
    const capMatch = fullText.match(/(?:CAPITALI[ZS]ATION|CAPITAL STRUCTURE|DEBT|CONVERTIBLE)([\s\S]{0,5000}?)(?:Item \d+\.|MANAGEMENT|$)/i);
    if (capMatch) sections.capitalStructure = capMatch[1]?.trim();
    const secMatch = fullText.match(/(?:SECURITY HOLDINGS|SECURITIES)([\s\S]{0,3000}?)(?:Item \d+\.|$)/i);
    if (secMatch) sections.securityHoldings = secMatch[1]?.trim();
    return sections;
  }
  scanForToxicityIndicators(text: string) {
    const redFlags = ['no conversion price floor', 'variable conversion rate', 'full ratchet', 'anti-dilution', 'excessive discount', 'warrant', 'mandatory redemption', 'penalty interest', 'liquidation preference', 'control right', 'negative covenant', 'default provision', 'mandatory repurchase', 'piggyback registration'];
    const greenFlags = ['valuation cap', 'fixed discount', 'weighted average', 'protective provision', 'conversion floor', 'capped interest'];
    const foundRedFlags: string[] = [];
    const foundGreenFlags: string[] = [];
    const lowerText = text.toLowerCase();
    for (const flag of redFlags) if (lowerText.includes(flag)) foundRedFlags.push(flag);
    for (const flag of greenFlags) if (lowerText.includes(flag)) foundGreenFlags.push(flag);
    return { redFlags: foundRedFlags, greenFlags: foundGreenFlags };
  }
  async processFiling(filing: EDGARFiling): Promise<FetchResult> {
    try {
      const filingUrl = await this.getFilingIndex(filing.cik, filing.accessionNumber);
      if (!filingUrl) return { filing, success: false, error: 'Could not locate filing document in SEC Archives' };
      const fullText = await this.getFullText(filingUrl);
      if (!fullText) return { filing, success: false, error: 'Failed to fetch filing full text' };
      const extractedSections = this.extractRelevantSections(fullText, filing.formType);
      const allText = Object.values(extractedSections).join(' ');
      const toxicityIndicators = this.scanForToxicityIndicators(allText);
      return { filing: { ...filing, fullText, extractedSections }, success: true, toxicityIndicators };
    } catch (error) {
      return { filing, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
export { EDGARFetcher, EDGARFiling, FetchResult };
