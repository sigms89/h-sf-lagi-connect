// ============================================================
// Húsfélagið.is — Transaction Categorization Engine
// Rule-based categorization of bank transactions
// ============================================================

import type { Category, VendorRule } from '@/types/database';

interface CategorizeResult {
  categoryNameIs: string;
  method: 'vendor_rule' | 'keyword' | 'fallback';
  isIncome: boolean;
  isIndividualPayment: boolean;
}

// Built-in keyword patterns for common Icelandic housing expenses
const KEYWORD_RULES: Array<{ pattern: RegExp; category: string; isIncome?: boolean; isIndividualPayment?: boolean }> = [
  // Utilities
  { pattern: /hs\s*orka|orkuveita|rarik|rafmagn/i, category: 'Rafmagn' },
  { pattern: /veitur|hitaveita|heitt\s*vatn/i, category: 'Hitaveita' },
  { pattern: /hringdu|síminn|vodafone|nova/i, category: 'Fjarskipti' },
  
  // Maintenance
  { pattern: /viðhald|málning|múr|þak|viðgerð/i, category: 'Viðhald' },
  { pattern: /ræsting|þrif|hreins/i, category: 'Ræsting' },
  { pattern: /garð|garðyrkj|slátt/i, category: 'Garðvinna' },
  { pattern: /lyfta|lyftutækni/i, category: 'Lyfta' },
  { pattern: /pípulagn|pípari|klósett/i, category: 'Pípulagnir' },
  { pattern: /rafvirkj|raflögn/i, category: 'Rafvirkjun' },
  
  // Insurance & Fees
  { pattern: /trygging|vátrygging|sjóvá|tg/i, category: 'Tryggingar' },
  { pattern: /fasteignagjöld|sveitarsjóð|útsvar/i, category: 'Fasteignagjöld' },
  { pattern: /sorphirða|sorpgjald/i, category: 'Sorphirða' },
  
  // Management
  { pattern: /bókhal|endurskoð/i, category: 'Bókhald' },
  { pattern: /husfélag.*gjald|félagsgjald/i, category: 'Félagsgjöld' },
  
  // Income patterns
  { pattern: /husfélagsgjald|húsfélagsgjald|gjaldgreiðsl/i, category: 'Húsfélagsgjöld', isIncome: true, isIndividualPayment: true },
  
  // Individual payments (likely residents paying fees)
  { pattern: /millifærsla.*frá|innborgun/i, category: 'Húsfélagsgjöld', isIncome: true, isIndividualPayment: true },
];

export function categorizeTransaction(
  description: string,
  amount: number,
  vendorRules: VendorRule[],
  categories: Category[]
): CategorizeResult {
  const isIncome = amount > 0;
  const desc = description.toLowerCase();

  // 1. Try vendor rules first (highest priority)
  for (const rule of vendorRules) {
    const pattern = new RegExp(rule.keyword_pattern, 'i');
    if (pattern.test(desc)) {
      const cat = categories.find((c) => c.id === rule.category_id);
      return {
        categoryNameIs: cat?.name_is ?? 'Óflokkað',
        method: 'vendor_rule',
        isIncome,
        isIndividualPayment: false,
      };
    }
  }

  // 2. Try built-in keyword rules
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(desc)) {
      return {
        categoryNameIs: rule.category,
        method: 'keyword',
        isIncome: rule.isIncome ?? isIncome,
        isIndividualPayment: rule.isIndividualPayment ?? false,
      };
    }
  }

  // 3. Fallback
  return {
    categoryNameIs: 'Óflokkað',
    method: 'fallback',
    isIncome,
    isIndividualPayment: false,
  };
}
