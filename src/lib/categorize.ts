// ============================================================
// Húsfélagið.is — Transaction Categorization Engine
// Rule-based categorization of bank transactions
// Category names MUST match the DB seed in migration exactly.
// ============================================================

import type { Category, VendorRule } from '@/types/database';

interface CategorizeResult {
  categoryNameIs: string;
  method: 'vendor_rule' | 'keyword' | 'fallback';
  isIncome: boolean;
  isIndividualPayment: boolean;
}

// Built-in keyword patterns for common Icelandic housing expenses
// Category names here match the DB categories table exactly
const KEYWORD_RULES: Array<{
  pattern: RegExp;
  category: string;
  isIncome?: boolean;
  isIndividualPayment?: boolean;
}> = [
  // Utilities — "Rafmagn & Hiti"
  { pattern: /hs\s*orka|orkuveita|rarik|rafmagn/i, category: 'Rafmagn & Hiti' },
  { pattern: /veitur|hitaveita|heitt\s*vatn/i, category: 'Rafmagn & Hiti' },

  // Water — "Vatnsveita"
  { pattern: /vatnsveita|vatnsverk|kaldt\s*vatn/i, category: 'Vatnsveita' },

  // Telecom — maps to "Annað" (no dedicated telecom category in DB)
  { pattern: /hringdu|síminn|vodafone|nova/i, category: 'Annað' },

  // Maintenance — "Viðhald & Viðgerðir"
  { pattern: /viðhald|málning|múr|þak|viðgerð/i, category: 'Viðhald & Viðgerðir' },

  // Cleaning — "Ræsting & Þrif"
  { pattern: /ræsting|þrif|hreins/i, category: 'Ræsting & Þrif' },

  // Landscaping — "Garðyrkja & Umhverfi"
  { pattern: /garð|garðyrkj|slátt|snjómokstur/i, category: 'Garðyrkja & Umhverfi' },

  // Elevator — "Lyftuþjónusta"
  { pattern: /lyfta|lyftutækni/i, category: 'Lyftuþjónusta' },

  // Plumbing — "Pípulagnir"
  { pattern: /pípulagn|pípari|klósett/i, category: 'Pípulagnir' },

  // Painting — "Málning & Frágangsvinna"
  { pattern: /málningarverk|málari|lakk/i, category: 'Málning & Frágangsvinna' },

  // Electrical (maps to Viðhald)
  { pattern: /rafvirkj|raflögn/i, category: 'Viðhald & Viðgerðir' },

  // Insurance — "Tryggingar"
  { pattern: /trygging|vátrygging|sjóvá|tg/i, category: 'Tryggingar' },

  // Property tax — "Lóðaleiga / Fasteignagjöld"
  { pattern: /fasteignagjöld|sveitarsjóð|útsvar|lóðaleig/i, category: 'Lóðaleiga / Fasteignagjöld' },

  // Waste — "Sorpmeðhöndlun"
  { pattern: /sorphirða|sorpgjald|sorp/i, category: 'Sorpmeðhöndlun' },

  // Accounting / Admin — "Umsýsla & Stjórnun"
  { pattern: /bókhal|endurskoð|umsýsl/i, category: 'Umsýsla & Stjórnun' },

  // Common expenses — "Sameign & Sameiginlegur kostnaður"
  { pattern: /sameign|sameiginleg/i, category: 'Sameign & Sameiginlegur kostnaður' },

  // Interest — "Vaxtakostnaður"
  { pattern: /vextir|vaxtakostn/i, category: 'Vaxtakostnaður' },

  // Security — "Öryggisgæsla"
  { pattern: /örygg|eftirlitsm/i, category: 'Öryggisgæsla' },

  // Income — "Húsfélagsgjöld (innborgun)"
  {
    pattern: /husfélagsgjald|húsfélagsgjald|gjaldgreiðsl/i,
    category: 'Húsfélagsgjöld (innborgun)',
    isIncome: true,
    isIndividualPayment: true,
  },

  // Individual payments (likely residents paying fees)
  {
    pattern: /millifærsla.*frá|innborgun/i,
    category: 'Húsfélagsgjöld (innborgun)',
    isIncome: true,
    isIndividualPayment: true,
  },
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
    try {
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
    } catch {
      // Skip invalid regex patterns
      continue;
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
