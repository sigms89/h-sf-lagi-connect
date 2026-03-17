// ============================================================
// Húsfélagið.is — XLSX Binary Parser
// Uses SheetJS (xlsx) loaded from CDN for xlsx/xls files
// ============================================================

import { parseTransactionText, type ParseResult } from './parseTransactions';

let XLSX: any = null;

async function loadXLSX(): Promise<any> {
  if (XLSX) return XLSX;
  // Dynamic import from CDN — works in Vite/browser
  // @ts-ignore - CDN import has no type declarations
  const module = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  XLSX = module;
  return XLSX;
}

/**
 * Parse an xlsx/xls file by reading it as ArrayBuffer,
 * converting to CSV via SheetJS, then feeding to parseTransactionText.
 */
export async function parseXlsxFile(file: File): Promise<ParseResult & { warnings?: string[] }> {
  const xlsx = await loadXLSX();
  const buffer = await file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: 'array' });

  const warnings: string[] = [];

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      transactions: [],
      errors: [{ line: 1, message: 'Engin vinnublöð fundust í xlsx skrá', raw: '' }],
      warnings,
    };
  }

  if (workbook.SheetNames.length > 1) {
    warnings.push(`xlsx skrá inniheldur ${workbook.SheetNames.length} vinnublöð, aðeins fyrsta blaðið ("${sheetName}") er lesið.`);
  }

  const sheet = workbook.Sheets[sheetName];
  // Convert to tab-separated text (same format parseTransactionText expects)
  const csvText: string = xlsx.utils.sheet_to_csv(sheet, { FS: '\t', RS: '\n' });

  if (!csvText.trim()) {
    return {
      transactions: [],
      errors: [{ line: 1, message: 'Vinnublaðið er tómt', raw: '' }],
      warnings,
    };
  }

  const result = parseTransactionText(csvText);
  return { ...result, warnings };
}
