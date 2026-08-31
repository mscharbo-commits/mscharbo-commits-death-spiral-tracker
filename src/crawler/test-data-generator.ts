interface TestCompany {
  name: string;
  ticker: string;
  cik: string;
  sector: string;
  reason: string;
  recentFilings: { accessionNumber: string; formType: string; filingDate: string }[];
}
const TOXIC_CONVERTIBLE_TEST_COMPANIES: TestCompany[] = [
  { name: 'Mullen Automotive Inc', ticker: 'MULN', cik: '0001822074', sector: 'EV/Automotive', reason: 'Early-stage EV startup with heavy reliance on convertible financing', recentFilings: [{ accessionNumber: '0001193125-23-130456', formType: '8-K', filingDate: '2023-05-01' }] },
  { name: 'Faraday Future Intelligent Electric Inc', ticker: 'FFIE', cik: '0001811882', sector: 'EV/Automotive', reason: 'Struggling EV manufacturer with extended convertible debt maturity concerns', recentFilings: [{ accessionNumber: '0001564590-23-010123', formType: '10-K', filingDate: '2023-04-20' }] },
  { name: 'Hub Cyber Security Inc', ticker: 'HUBC', cik: '0001835818', sector: 'Cybersecurity/Tech', reason: 'Micro-cap with variable rate convertibles and high dilution risk', recentFilings: [{ accessionNumber: '0001564590-22-020456', formType: '10-Q', filingDate: '2022-11-15' }] },
  { name: 'Novus Capital Corporation', ticker: 'NVOS', cik: '0001804294', sector: 'SPAC/Finance', reason: 'SPAC-related entity with complex convertible capital structure', recentFilings: [{ accessionNumber: '0001193125-22-300123', formType: 'S-1', filingDate: '2022-12-01' }] },
  { name: 'GigForce Technologies Inc', ticker: 'GFAI', cik: '0001835888', sector: 'AI/Tech', reason: 'Early-stage AI company with warrant-heavy convertible issuances', recentFilings: [{ accessionNumber: '0001564590-23-050000', formType: '10-Q', filingDate: '2023-05-30' }] },
  { name: 'Soaring Technology Inc', ticker: 'SOAR', cik: '0001835900', sector: 'Aerospace/Tech', reason: 'Micro-cap with full-ratchet anti-dilution and no conversion floor', recentFilings: [{ accessionNumber: '0001564590-23-015000', formType: '10-K', filingDate: '2023-03-15' }] },
  { name: 'RCat Inc', ticker: 'RCAT', cik: '0001815555', sector: 'Biotech/Cannabis', reason: 'Cannabis-adjacent biotech with aggressive convertible terms', recentFilings: [{ accessionNumber: '0001193125-23-070000', formType: '10-Q', filingDate: '2023-08-10' }] },
  { name: 'Palantir Technologies Inc', ticker: 'PLTR', cik: '0001321655', sector: 'Data Analytics', reason: 'Reference point: large-cap with mature, non-toxic capital structure', recentFilings: [{ accessionNumber: '0001193125-21-099999', formType: '10-K', filingDate: '2021-02-26' }] },
  { name: 'Better.com Inc', ticker: 'BETR', cik: '0001827788', sector: 'FinTech/Real Estate', reason: 'Distressed FinTech with multiple convertible tranches', recentFilings: [{ accessionNumber: '0001193125-22-200000', formType: '10-Q', filingDate: '2022-08-15' }] },
  { name: 'The We Company (WeWork)', ticker: 'WE', cik: '0001616707', sector: 'Real Estate/Services', reason: 'Distressed SPAC merger with significant convertible debt burden', recentFilings: [{ accessionNumber: '0001193125-21-311111', formType: '10-K', filingDate: '2021-03-08' }] }
];
interface SyntheticConvertible {
  companyName: string;
  ticker: string;
  dealName: string;
  principal: number;
  conversionPrice: number | null;
  conversionRate: 'fixed' | 'variable';
  antiDilutionClause: 'none' | 'weighted-average' | 'full-ratchet';
  warrantsIncluded: boolean;
  discountPercent: number;
  maturityYears: number;
  mandatoryRedemption: boolean;
  notes: string;
}
function generateSyntheticConvertibles(): SyntheticConvertible[] {
  return [
    { companyName: 'Mullen Automotive Inc', ticker: 'MULN', dealName: 'MULN Series A Convertible', principal: 50000000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 25, maturityYears: 3, mandatoryRedemption: true, notes: 'Highly toxic structure; classic death spiral pattern' },
    { companyName: 'Faraday Future Intelligent Electric Inc', ticker: 'FFIE', dealName: 'FFIE Convertible Notes 2023', principal: 100000000, conversionPrice: 2.5, conversionRate: 'variable', antiDilutionClause: 'weighted-average', warrantsIncluded: true, discountPercent: 20, maturityYears: 5, mandatoryRedemption: false, notes: 'Mixed signals; some protective provisions' },
    { companyName: 'Hub Cyber Security Inc', ticker: 'HUBC', dealName: 'HUBC Convertible Preferred Series B', principal: 15000000, conversionPrice: 1.75, conversionRate: 'fixed', antiDilutionClause: 'weighted-average', warrantsIncluded: false, discountPercent: 15, maturityYears: 7, mandatoryRedemption: false, notes: 'Relatively clean structure' },
    { companyName: 'GigForce Technologies Inc', ticker: 'GFAI', dealName: 'GFAI Convertible + Warrant Package', principal: 25000000, conversionPrice: null, conversionRate: 'fixed', antiDilutionClause: 'none', warrantsIncluded: true, discountPercent: 30, maturityYears: 2, mandatoryRedemption: true, notes: 'Extremely toxic' },
    { companyName: 'Soaring Technology Inc', ticker: 'SOAR', dealName: 'SOAR Convertible Debentures', principal: 20000000, conversionPrice: 0.5, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 35, maturityYears: 2, mandatoryRedemption: true, notes: 'Death spiral case' },
    { companyName: 'Palantir Technologies Inc', ticker: 'PLTR', dealName: 'PLTR Convertible Notes 2020', principal: 600000000, conversionPrice: 24.0, conversionRate: 'fixed', antiDilutionClause: 'weighted-average', warrantsIncluded: false, discountPercent: 5, maturityYears: 10, mandatoryRedemption: false, notes: 'Large-cap with clean structure' }
  ];
}
function calculateToxicityScore(convertible: SyntheticConvertible): number {
  let score = 1;
  if (convertible.conversionPrice === null) score += 2;
  if (convertible.conversionRate === 'variable') score += 1.5;
  if (convertible.antiDilutionClause === 'full-ratchet') score += 2;
  if (convertible.antiDilutionClause === 'none') score += 1;
  if (convertible.warrantsIncluded) score += 1.5;
  if (convertible.discountPercent > 25) score += 2;
  if (convertible.discountPercent > 30) score += 1;
  if (convertible.mandatoryRedemption) score += 1;
  if (convertible.maturityYears < 3) score += 1;
  if (convertible.conversionPrice !== null && convertible.conversionPrice > 1) score -= 0.5;
  if (convertible.antiDilutionClause === 'weighted-average') score -= 1;
  if (convertible.conversionRate === 'fixed') score -= 0.5;
  if (!convertible.warrantsIncluded) score -= 0.5;
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}
export { TOXIC_CONVERTIBLE_TEST_COMPANIES, TestCompany, SyntheticConvertible, generateSyntheticConvertibles, calculateToxicityScore };
