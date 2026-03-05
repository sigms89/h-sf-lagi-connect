// ============================================================
// Húsfélagið.is — Transaction Categorization Engine (v2)
// Enhanced rule-based categorization with 5-tier priority system:
//   1. Vendor rules (DB) — highest priority, regex match
//   2. Smart individual detection — Icelandic person name heuristic
//   3. Bank fee detection — exact ±360 amount
//   4. Known vendor keywords — expanded list
//   5. Fallback — "Óflokkað"
//
// Category names MUST match the DB seed in migration exactly.
// ============================================================

import type { Category, VendorRule } from '@/types/database';

// ============================================================
// TYPES
// ============================================================

export interface CategorizeResult {
  categoryNameIs: string;
  method: 'vendor_rule' | 'individual_detection' | 'bank_fee' | 'keyword' | 'fallback';
  isIncome: boolean;
  isIndividualPayment: boolean;
  confidence: number; // 0–1 confidence score
}

// ============================================================
// ICELANDIC NAME DETECTION
// Matches: "Jón Jónsson", "Guðrún Ósk Óskarsdóttir", "Axel Ingi Eiríksson"
// Must NOT match entities ending in company suffixes (ehf, hf, sf, ses, ohf, slhf)
// Strategy: every word is capitalised, contains Icelandic chars, ends in -son/-dóttir
//   OR is just 2–4 capitalised Icelandic words with no company suffix anywhere.
// ============================================================

// Icelandic character set in word chars
const IS_UPPER = 'A-ZÁÉÍÓÚÝÞÐÆÖ';
const IS_LOWER = 'a-záéíóúýþðæö';
const IS_WORD  = `[${IS_UPPER}${IS_LOWER}]`;

// A single Icelandic capitalised word (incl. hyphenated, e.g. "Anna-Margrét")
const CAP_WORD = `[${IS_UPPER}]${IS_WORD}{1,}(?:-[${IS_UPPER}]${IS_WORD}+)*`;

// Company suffix patterns to EXCLUDE
const COMPANY_SUFFIX_RE = /\b(ehf|hf|sf|ses|ohf|slhf|lhf|ásb|bs)\b\.?$/i;

// Strong indicator: last word ends in -son, -dóttir, -sen (Icelandic patronymics)
const PATRONYMIC_RE = /(son|dóttir|sen)\s*$/i;

/**
 * Returns true if the description looks like an Icelandic person name:
 *   - 2 to 4 words, all capitalised
 *   - No company suffixes
 *   - Amount must be positive (incoming payment)
 */
function isIcelandicPersonName(description: string): boolean {
  const trimmed = description.trim();

  // Reject if company suffix present
  if (COMPANY_SUFFIX_RE.test(trimmed)) return false;

  // Reject if it contains digits (kennitala, account numbers, etc.)
  if (/\d/.test(trimmed)) return false;

  // Reject common non-name keywords
  const nonNameKeywords = /\b(millifærsla|innborgun|greiðsla|reikningur|gjald|kostnaður|þjónusta|kaup|sala|endurgreiðsla|leiga|lán)\b/i;
  if (nonNameKeywords.test(trimmed)) return false;

  // Build regex: 2 to 4 capitalised Icelandic words, nothing else
  const fullNameRe = new RegExp(
    `^(${CAP_WORD})(?:\\s+(${CAP_WORD})){1,3}$`
  );

  if (!fullNameRe.test(trimmed)) return false;

  // Boost confidence: at least one word ends in a patronymic suffix
  // We still return true even without it — 2+ cap words is sufficient
  return true;
}

// ============================================================
// KEYWORD RULES
// Ordered: first match wins within this tier.
// ============================================================

interface KeywordRule {
  pattern: RegExp;
  category: string;
  isIncome?: boolean;
  isIndividualPayment?: boolean;
  confidence?: number;
}

const KEYWORD_RULES: KeywordRule[] = [
  // ---- Utilities ----
  {
    pattern: /orka\s*náttúrunnar|íslensk\s*orkumiðlun|n1\s*ehf|orkuveita|rarik|hs\s*orka|veitur/i,
    category: 'Rafmagn & Hiti',
    confidence: 0.95,
  },

  // ---- Water ----
  {
    pattern: /vatnsveita|vatnsverk/i,
    category: 'Vatnsveita',
    confidence: 0.95,
  },

  // ---- Insurance ----
  {
    pattern: /tm\s*trygging|vís\s*trygging|sjóvá|tryggingarfélag/i,
    category: 'Tryggingar',
    confidence: 0.95,
  },

  // ---- Elevator ----
  {
    pattern: /schindler|lyftu|kone/i,
    category: 'Lyftuþjónusta',
    confidence: 0.92,
  },

  // ---- Cleaning ----
  {
    pattern: /b\.?g\.?\s*þjónust|ræsting|þrif|hreins/i,
    category: 'Ræsting & Þrif',
    confidence: 0.93,
  },

  // ---- Administration ----
  {
    pattern: /eignaumsjón|hússjóð|klar\s*ehf|húsfélagsþjón/i,
    category: 'Umsýsla & Stjórnun',
    confidence: 0.93,
  },

  // ---- Collection fees ----
  {
    pattern: /kröfumiðlun/i,
    category: 'Innheimtukostnaður',
    confidence: 0.97,
  },

  // ---- Landscaping ----
  {
    pattern: /glaðir\s*garðar|garð|slátt|snjómokstur/i,
    category: 'Garðyrkja & Umhverfi',
    confidence: 0.90,
  },

  // ---- Security ----
  {
    pattern: /varnir\s*og\s*eftirlit|örygg/i,
    category: 'Öryggisgæsla',
    confidence: 0.93,
  },

  // ---- Property tax / land lease ----
  {
    pattern: /fasteignagjöld|sveitarsjóð|lóðaleig/i,
    category: 'Lóðaleiga / Fasteignagjöld',
    confidence: 0.95,
  },

  // ---- Waste ----
  {
    pattern: /sorphirð|sorpgjald/i,
    category: 'Sorpmeðhöndlun',
    confidence: 0.95,
  },

  // ---- Plumbing ----
  {
    pattern: /pípulagn|pípari/i,
    category: 'Pípulagnir',
    confidence: 0.93,
  },

  // ---- Painting ----
  {
    pattern: /málning|málari|lakk/i,
    category: 'Málning & Frágangsvinna',
    confidence: 0.92,
  },

  // ---- Maintenance (broad — keep after painting/plumbing) ----
  {
    pattern: /viðhald|þakviðgerð|múr|viðgerð|héðinshurð|rafinn|bílar\s*og\s*varahlutir/i,
    category: 'Viðhald & Viðgerðir',
    confidence: 0.88,
  },

  // ---- Interest ----
  {
    pattern: /vextir|vaxtakostn/i,
    category: 'Vaxtakostnaður',
    confidence: 0.95,
  },

  // ---- Accounting / Admin ----
  {
    pattern: /bókhal|endurskoð/i,
    category: 'Umsýsla & Stjórnun',
    confidence: 0.92,
  },

  // ---- Company paying HOA fees ----
  {
    pattern: /félagsbústaðir/i,
    category: 'Húsfélagsgjöld (innborgun)',
    isIncome: true,
    isIndividualPayment: false,
    confidence: 0.90,
  },
];

// ============================================================
// MAIN FUNCTION
// ============================================================

export function categorizeTransaction(
  description: string,
  amount: number,
  vendorRules: VendorRule[],
  categories: Category[]
): CategorizeResult {
  const isIncome = amount > 0;
  // Use original casing for name detection; lowercase for keyword matching
  const desc = description.trim();
  const descLower = desc.toLowerCase();

  // ----------------------------------------------------------------
  // TIER 1: Vendor rules from DB (highest priority)
  // ----------------------------------------------------------------
  for (const rule of vendorRules) {
    try {
      const pattern = new RegExp(rule.keyword_pattern, 'i');
      if (pattern.test(desc)) {
        const cat = categories.find((c) => c.id === rule.category_id);
        return {
          categoryNameIs: cat?.name_is ?? 'Óflokkað',
          method: 'vendor_rule',
          isIncome,
          isIndividualPayment: false,
          confidence: 1.0,
        };
      }
    } catch {
      // Skip invalid regex
      continue;
    }
  }

  // ----------------------------------------------------------------
  // TIER 2: Smart individual detection
  // Positive amount + description looks like an Icelandic person name
  // ----------------------------------------------------------------
  if (amount > 0 && isIcelandicPersonName(desc)) {
    return {
      categoryNameIs: 'Húsfélagsgjöld (innborgun)',
      method: 'individual_detection',
      isIncome: true,
      isIndividualPayment: true,
      confidence: 0.85,
    };
  }

  // ----------------------------------------------------------------
  // TIER 3: Bank fee detection — exact amount of ±360
  // ----------------------------------------------------------------
  if (amount === 360 || amount === -360) {
    return {
      categoryNameIs: 'Bankakostnaður',
      method: 'bank_fee',
      isIncome: false,
      isIndividualPayment: false,
      confidence: 0.99,
    };
  }

  // ----------------------------------------------------------------
  // TIER 4: Known vendor keyword matching
  // ----------------------------------------------------------------
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(descLower)) {
      // Determine income: rule override, else infer from amount sign
      const resolvedIsIncome = rule.isIncome !== undefined ? rule.isIncome : isIncome;
      return {
        categoryNameIs: rule.category,
        method: 'keyword',
        isIncome: resolvedIsIncome,
        isIndividualPayment: rule.isIndividualPayment ?? false,
        confidence: rule.confidence ?? 0.80,
      };
    }
  }

  // ----------------------------------------------------------------
  // TIER 5: Fallback
  // ----------------------------------------------------------------
  return {
    categoryNameIs: 'Óflokkað',
    method: 'fallback',
    isIncome,
    isIndividualPayment: false,
    confidence: 0.0,
  };
}
