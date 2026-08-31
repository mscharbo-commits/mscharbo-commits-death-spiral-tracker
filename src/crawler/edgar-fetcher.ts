export type EDGARFiling = {
  cik: string;
  companyName: string;
  accessionNumber: string;
  filingDate: string;
  formType: string;
  filePath: string;
};

export type FetchResult = {
  success: boolean;
  data?: string;
  error?: string;
};

export class EDGARFetcher {
  private readonly USER_AGENT = 'Death-Spiral-Tracker/1.0';
  private readonly RATE_LIMIT_MS = 100;
  private lastRequestTime = 0;

  async processFiling(filing: EDGARFiling): Promise<FetchResult> {
    try {
      await this.rateLimit();
      const url = `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${filing.filePath}/index.htm`;
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      if (!response.ok) return { success: false, error: 'Could not locate' };
      return { success: true, data: await response.text() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async rateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.RATE_LIMIT_MS) {
      await new Promise(r => setTimeout(r, this.RATE_LIMIT_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}

export { EDGARFetcher as default };
