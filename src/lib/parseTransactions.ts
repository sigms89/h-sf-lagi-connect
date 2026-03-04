// ============================================================
// Húsfélagið.is — Transaction Text Parser
// Parses pasted bank statement text into structured transactions
// ============================================================

import { format, parse, isValid } from 'date-fns';
import { is } from 'date-fns/locale';

/**
 * Detect if pasted text looks like JSON rather than tab/semicolon bank data.
 */
export function isLikelyJson(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return true;
  // Check first few non-empty lines for JSON-like patterns
  const lines = trimmed.split('\n').slice(0, 5).map(l => l.trim()).filter(Boolean);
  const jsonIndicators = lines.filter(l => /"date"|"amount"|"description"|"dagsetning"|"upphaed"/.test(l));
  return jsonIndicators.length >= 2;
}

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
const MAX_ERRORS = 200;

export function parseTransactionText(text: string): ParseResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];
  let skippedErrors = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab or semicolon
    const parts = line.includes('\t') ? line.split('\t') : line.split(';');
    
    if (parts.length < 3) {
      // Skip header-like lines silently
      if (i === 0 && (line.toLowerCase().includes('dagsetning') || line.toLowerCase().includes('date'))) {
        continue;
      }
      if (errors.length < MAX_ERRORS) {
        errors.push({ line: i + 1, message: 'Of fáir dálkar', raw: line });
      } else {
        skippedErrors++;
      }
      continue;
    }

    const date = parseDate(parts[0]);
    if (!date) {
      // Skip lines that don't start with a date (likely headers)
      if (i === 0) continue;
      if (errors.length < MAX_ERRORS) {
        errors.push({ line: i + 1, message: 'Ógild dagsetning', raw: line });
      } else {
        skippedErrors++;
      }
      continue;
    }

    const description = parts[1]?.trim();
    if (!description) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ line: i + 1, message: 'Lýsing vantar', raw: line });
      } else {
        skippedErrors++;
      }
      continue;
    }

    const amount = parseIcelandicNumber(parts[2]);
    if (amount === null) {
      if (errors.length < MAX_ERRORS) {
        errors.push({ line: i + 1, message: 'Ógild upphæð', raw: line });
      } else {
        skippedErrors++;
      }
      continue;
    }

    const balance = parts.length > 3 ? parseIcelandicNumber(parts[3]) : null;

    transactions.push({ date, description, amount, balance });
  }

  if (skippedErrors > 0) {
    errors.push({ line: 0, message: `...og ${skippedErrors} villur til viðbótar (sýndar eru fyrstu ${MAX_ERRORS})`, raw: '' });
  }

  return { transactions, errors };
}

/**
 * Parse JSON array of transactions.
 * Expected shape: [{ date, description, amount, balance?, category? }]
 */
export function parseJsonTransactions(jsonText: string): ParseResult & { warnings?: string[] } {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  let arr: unknown[];

  // ---- Stage A: strict parse on cleaned input ----
  function strictParse(text: string): unknown | null {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  // ---- Stage B: repair common copy-paste issues ----
  function repairAndParse(text: string): unknown | null {
    let t = text.trim();
    // Remove trailing commas before ] or }
    t = t.replace(/,\s*([\]}])/g, '$1');
    // Wrap bare object in array
    if (t.startsWith('{') && !t.startsWith('[')) {
      t = '[' + t + ']';
    }
    // Auto-close: count unmatched brackets outside of strings
    let inString = false;
    let escape = false;
    let openBrackets = 0;
    let openBraces = 0;
    for (const ch of t) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets--;
      else if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
    }
    // Remove dangling trailing comma at the very end of content
    t = t.replace(/,\s*$/, '');
    // Close any open braces/brackets
    while (openBraces > 0) { t += '}'; openBraces--; }
    while (openBrackets > 0) { t += ']'; openBrackets--; }
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }

  // ---- Stage C: extract individual { ... } objects (linear scan, safe for large input) ----
  function extractObjects(text: string): unknown[] {
    // Size guard: skip regex on very large broken text to avoid hangs
    if (text.length > 500_000) {
      // Use simple line-based extraction instead
      return extractObjectsLinear(text);
    }
    const results: unknown[] = [];
    const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let m: RegExpExecArray | null;
    let safetyCounter = 0;
    while ((m = regex.exec(text)) !== null && safetyCounter < 50_000) {
      safetyCounter++;
      try {
        results.push(JSON.parse(m[0]));
      } catch {
        // skip unparseable fragment
      }
    }
    return results;
  }

  function extractObjectsLinear(text: string): unknown[] {
    // Scan for lines that look like JSON objects
    const results: unknown[] = [];
    const lines = text.split('\n');
    let buffer = '';
    let depth = 0;
    for (const line of lines) {
      for (const ch of line) {
        if (ch === '{') { if (depth === 0) buffer = ''; depth++; }
        if (depth > 0) buffer += ch;
        if (ch === '}') {
          depth--;
          if (depth === 0 && buffer) {
            try { results.push(JSON.parse(buffer)); } catch { /* skip */ }
            buffer = '';
            if (results.length >= 50_000) return results;
          }
        }
      }
      if (depth > 0) buffer += '\n';
    }
    return results;
  }

  // ---- Stage D: try NDJSON (one JSON object per line) ----
  function tryNDJSON(text: string): unknown[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const results: unknown[] = [];
    for (const line of lines) {
      try { results.push(JSON.parse(line)); } catch { /* skip */ }
    }
    return results.length >= lines.length * 0.5 ? results : [];
  }

  // Run stages in order
  let cleaned = jsonText.trim();
  if (!cleaned) {
    errors.push({ line: 1, message: 'Ekkert JSON inntak', raw: '' });
    return { transactions, errors, warnings };
  }

  // Stage A
  let parsed = strictParse(cleaned);
  if (parsed !== null) {
    arr = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    // Stage B — repair
    parsed = repairAndParse(cleaned);
    if (parsed !== null) {
      arr = Array.isArray(parsed) ? parsed : [parsed];
      warnings.push('JSON var lagað sjálfvirkt (lokað vöntuðum svigum/hornklofum).');
    } else {
      // Stage C — extract objects
      const extracted = extractObjects(cleaned);
      if (extracted.length > 0) {
        arr = extracted;
        warnings.push(`Náði að lesa ${extracted.length} færslur úr ófullkomnu JSON. Hluti gagna gæti hafa tapast.`);
      } else {
        // Stage D — NDJSON
        const ndjson = tryNDJSON(cleaned);
        if (ndjson.length > 0) {
          arr = ndjson;
          warnings.push(`Lesið sem NDJSON (ein færsla per línu). ${ndjson.length} færslur fundust.`);
        } else {
          errors.push({ line: 1, message: 'Ógilt JSON snið. Athugaðu hvort vantar ] eða } í lok, eða hvort textinn er klipptur.', raw: cleaned.slice(0, 200) });
          return { transactions, errors, warnings };
        }
      }
    }
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

  return { transactions, errors, warnings };
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
