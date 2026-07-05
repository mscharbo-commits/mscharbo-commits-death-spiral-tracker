import { searchEdgar } from '../lib/edgar';
import { extractConversion8K } from '../lib/sonnet';
import { createClient } from '../lib/supabase';
import axios from 'axios';

async function getFilingUrl(cik: string, accessionNumber: string): Promise<string> {
  return `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accessionNumber}&xbrl_type=v`;
}

async function getFilingText(filingUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(filingUrl, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch filing: ${filingUrl}`, error);
    return null;
  }
}

export async function run8KConversionScan() {
  const supabase = createClient();
  let conversionsFound = 0;

  console.log(`[${new Date().toISOString()}] Starting 8-K conversion scan...`);

  const searchTerms = [
    'conversion of convertible',
    'converted convertible note',
    'convertible note conversion',
    'unregistered sale of equity convertible',
  ];

  for (const searchTerm of searchTerms) {
    console.log(`Searching for: "${searchTerm}"`);
    try {
      const results = await searchEdgar(searchTerm);
      console.log(`Found ${results.length} potential 8-K conversions`);

      for (const result of results) {
        if (result.form !== '8-K') continue;

        const filingUrl = await getFilingUrl(result.cik, result.accessionNumber);
        const filingText = await getFilingText(filingUrl);

        if (!filingText) {
          console.warn(`Could not fetch 8-K text: ${result.conm}`);
          continue;
        }

        const conversions = await extractConversion8K(filingText);

        if (!conversions || conversions.length === 0) continue;

        console.log(`✓ CONVERSION FOUND: ${result.conm}`);

        const companyResult = await supabase
          .from('death_spiral_companies')
          .select('id')
          .eq('cik', result.cik)
          .single();

        if (!companyResult.data) continue;

        const notesResult = await supabase
          .from('death_spiral_notes')
          .select('id')
          .eq('company_id', companyResult.data.id);

        if (!notesResult.data || notesResult.data.length === 0) continue;

        for (const conversion of conversions) {
          console.log(`  ${conversion.investorName}: $${conversion.amountConverted.toLocaleString()}`);

          const investorResult = await supabase
            .from('death_spiral_investors')
            .select('id')
            .eq('investor_name', conversion.investorName)
            .eq('note_id', notesResult.data[0].id)
            .single();

          if (!investorResult.data) continue;

          const insertResult = await supabase
            .from('death_spiral_conversions')
            .insert([
              {
                investor_id: investorResult.data.id,
                conversion_date: conversion.conversionDate,
                amount_converted: conversion.amountConverted,
                shares_issued: conversion.sharesIssued,
                conversion_price:

ls -la crawler/lib/sonnet.ts crawler/jobs/daily-edgar-scan.ts crawler/jobs/8k-conversion-scan.ts


