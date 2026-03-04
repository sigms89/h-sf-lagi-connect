// ============================================================
// Húsfélagið.is — Transaction Text Parser
// Parses pasted bank statement text into structured transactions
// ============================================================

import { format, parse, isValid } from 'date-fns';
import { is } from 'date-fns/locale';

export interface ParsedTransaction {
  date: string; // ISO format yyyy-MM-dd
  description: string;
  amount: number;
  balance: number | null;
}

export interface ParseError {
  line: number;
  message: string;
  raw: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: ParseError[];
}

/**
 * Parse Icelandic number format: "1.234.567" or "-45.188" or "15.000,50"
 */
function parseIcelandicNumber(str: string): number | null {
  if (!str || !str.trim()) return null;
  let cleaned = str.trim();
  // Remove thousand separators (dots in Icelandic format)
  // If there's a comma, it's a decimal separator
  if (cleaned.includes(',')) {
    // Has decimal: dots are thousands, comma is decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // No comma: check if it looks like a decimal or thousands
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots = thousands separator
      cleaned = cleaned.replace(/\./g, '');
    } else if (dotCount === 1) {
      // Single dot: if 3 digits after = thousands, otherwise decimal
      const afterDot = cleaned.split('.')[1];
      if (afterDot && afterDot.length === 3) {
        cleaned = cleaned.replace('.', '');
      }
    }
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Try to parse various Icelandic date formats
 */
function parseDate(str: string): string | null {
  const trimmed = str.trim();
  
  // dd.MM.yyyy
  const formats = ['dd.MM.yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'd.M.yyyy'];
  for (const fmt of formats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
  }
  return null;
}

/**
 * Parse pasted bank statement text.
 * Expects tab or semicolon-separated values:
 * date \t description \t amount [\t balance]
 */
export function parseTransactionText(text: string): ParseResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab or semicolon
    const parts = line.includes('\t') ? line.split('\t') : line.split(';');
    
    if (parts.length < 3) {
      // Skip header-like lines silently
      if (i === 0 && (line.toLowerCase().includes('dagsetning') || line.toLowerCase().includes('date'))) {
        continue;
      }
      errors.push({ line: i + 1, message: 'Of fáir dálkar', raw: line });
      continue;
    }

    const date = parseDate(parts[0]);
    if (!date) {
      // Skip lines that don't start with a date (likely headers)
      if (i === 0) continue;
      errors.push({ line: i + 1, message: 'Ógild dagsetning', raw: line });
      continue;
    }

    const description = parts[1]?.trim();
    if (!description) {
      errors.push({ line: i + 1, message: 'Lýsing vantar', raw: line });
      continue;
    }

    const amount = parseIcelandicNumber(parts[2]);
    if (amount === null) {
      errors.push({ line: i + 1, message: 'Ógild upphæð', raw: line });
      continue;
    }

    const balance = parts.length > 3 ? parseIcelandicNumber(parts[3]) : null;

    transactions.push({ date, description, amount, balance });
  }

  return { transactions, errors };
}

/**
 * Parse JSON array of transactions.
 * Expected shape: [{ date, description, amount, balance?, category? }]
 */
export function parseJsonTransactions(jsonText: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  let arr: unknown[];
  try {
    // Try to auto-fix common JSON issues before parsing
    let cleaned = jsonText.trim();
    // Remove trailing commas before ] or }
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    // If it doesn't start with [ or {, try wrapping in array
    if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
      cleaned = '[' + cleaned + ']';
    }
    const parsed = JSON.parse(cleaned);
    arr = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    const errMsg = e instanceof SyntaxError ? e.message : 'Óþekkt villa';
    errors.push({ line: 1, message: `Ógilt JSON snið: ${errMsg}`, raw: jsonText.slice(0, 200) });
    return { transactions, errors };
  }

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object') {
      errors.push({ line: i + 1, message: 'Ekki hlutur', raw: JSON.stringify(item) });
      continue;
    }

    // Date
    const rawDate = String(item.date ?? item.dagsetning ?? '');
    let date: string | null = null;
    if (rawDate) {
      // Try ISO format first
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        date = format(d, 'yyyy-MM-dd');
      } else {
        date = parseDate(rawDate);
      }
    }
    if (!date) {
      errors.push({ line: i + 1, message: 'Ógild dagsetning', raw: rawDate });
      continue;
    }

    // Description
    const description = String(item.description ?? item.lysing ?? item.lýsing ?? '').trim();
    if (!description) {
      errors.push({ line: i + 1, message: 'Lýsing vantar', raw: JSON.stringify(item) });
      continue;
    }

    // Amount
    const rawAmount = item.amount ?? item.upphaed ?? item.upphæð;
    const amount = typeof rawAmount === 'number' ? rawAmount : parseIcelandicNumber(String(rawAmount ?? ''));
    if (amount === null) {
      errors.push({ line: i + 1, message: 'Ógild upphæð', raw: String(rawAmount) });
      continue;
    }

    // Balance (optional)
    const rawBalance = item.balance ?? item.staða ?? item.stada;
    const balance = rawBalance != null
      ? (typeof rawBalance === 'number' ? rawBalance : parseIcelandicNumber(String(rawBalance)))
      : null;

    // Category hint (optional — stored in description metadata for categorizer)
    const categoryHint = String(item.category ?? item.flokkur ?? '').trim();

    transactions.push({
      date,
      description,
      amount,
      balance,
      ...(categoryHint ? { categoryHint } : {}),
    } as ParsedTransaction & { categoryHint?: string });
  }

  return { transactions, errors };
}

/**
 * Format a date string for Icelandic display
 */
export function formatDateIs(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'd. MMM yyyy', { locale: is });
  } catch {
    return dateStr;
  }
}
