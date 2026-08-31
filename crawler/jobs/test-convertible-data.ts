function generateSyntheticConvertibles() {
  return [
    { companyName: 'BioPharm Startup Inc', ticker: 'BIOPX', dealName: 'Series C - FLOORLESS', principal: 8000000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 40, maturityYears: 2, mandatoryRedemption: true, notes: 'Micro-cap biotech, cash burning.' },
    { companyName: 'EV Battery Maker', ticker: 'EVBAT', dealName: 'Survival Round', principal: 12000000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 45, maturityYears: 1.5, mandatoryRedemption: true, notes: '45% discount + floorless = massive dilution.' },
    { companyName: 'Cannabis Tech', ticker: 'CANTECH', dealName: 'Emergency Debt', principal: 5500000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 50, maturityYears: 1, mandatoryRedemption: true, notes: 'Penny stock. 50% discount + no floor.' },
    { companyName: 'FinTech Struggling', ticker: 'FTST', dealName: 'Restructuring', principal: 6000000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 35, maturityYears: 2, mandatoryRedemption: true, notes: 'Running out of cash.' },
    { companyName: 'Crypto Mining Ops', ticker: 'CMOP', dealName: 'Debt Restructure', principal: 15000000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 38, maturityYears: 2, mandatoryRedemption: true, notes: 'Crypto volatility.' },
    { companyName: 'Medical Device', ticker: 'MDVCE', dealName: 'Bridge Financing', principal: 4200000, conversionPrice: null, conversionRate: 'variable', antiDilutionClause: 'full-ratchet', warrantsIncluded: true, discountPercent: 42, maturityYears: 1.5, mandatoryRedemption: true, notes: 'Pre-revenue. FDA pending.' },
  ];
}

function calculateToxicityScore(convertible: any) {
  let score = 1;
  if (convertible.conversionPrice === null) score += 3;
  if (convertible.conversionRate === 'variable') score += 2;
  if (convertible.antiDilutionClause === 'full-ratchet') score += 2.5;
  if (convertible.warrantsIncluded) score += 2;
  if (convertible.discountPercent > 40) score += 2.5;
  else if (convertible.discountPercent > 30) score += 2;
  if (convertible.maturityYears < 1.5) score += 2;
  else if (convertible.maturityYears < 3) score += 1.5;
  if (convertible.mandatoryRedemption) score += 1.5;
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

export { generateSyntheticConvertibles, calculateToxicityScore };
