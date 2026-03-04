// ============================================================
// Category color helpers and ISK formatting
// ============================================================

export interface CategoryConfig {
  nameIs: string;
  nameEn: string;
  icon: string;
  color: string;
  slug: string;
  isIncome?: boolean;
}

export const CATEGORIES: CategoryConfig[] = [
  { nameIs: 'Rafmagn', nameEn: 'Electricity', icon: 'Zap', color: 'yellow', slug: 'rafmagn' },
  { nameIs: 'Hitaveita', nameEn: 'Heating', icon: 'Flame', color: 'red', slug: 'hitaveita' },
  { nameIs: 'Vatnsveita', nameEn: 'Water', icon: 'Droplets', color: 'blue', slug: 'vatnsveita' },
  { nameIs: 'Tryggingar', nameEn: 'Insurance', icon: 'Shield', color: 'indigo', slug: 'tryggingar' },
  { nameIs: 'Viðhald', nameEn: 'Maintenance', icon: 'Wrench', color: 'orange', slug: 'vidhald' },
  { nameIs: 'Ræsting', nameEn: 'Cleaning', icon: 'Sparkles', color: 'cyan', slug: 'raesting' },
  { nameIs: 'Lyfta', nameEn: 'Elevator', icon: 'ArrowUpDown', color: 'purple', slug: 'lyfta' },
  { nameIs: 'Sameiginlegur kostnaður', nameEn: 'Common costs', icon: 'Users', color: 'teal', slug: 'sameiginlegur-kostnadur' },
  { nameIs: 'Fjarskipti', nameEn: 'Telecom', icon: 'Wifi', color: 'green', slug: 'fjarskipti' },
  { nameIs: 'Bókhaldsþjónusta', nameEn: 'Accounting', icon: 'Calculator', color: 'gray', slug: 'bokhaldsthjonusta' },
  { nameIs: 'Snjómokstur', nameEn: 'Snow removal', icon: 'Snowflake', color: 'blue', slug: 'snjomokstur' },
  { nameIs: 'Garðvinna', nameEn: 'Gardening', icon: 'Flower2', color: 'green', slug: 'gardvinna' },
  { nameIs: 'Sorpþjónusta', nameEn: 'Waste', icon: 'Trash2', color: 'gray', slug: 'sorpthjonusta' },
  { nameIs: 'Annað', nameEn: 'Other', icon: 'HelpCircle', color: 'neutral', slug: 'annad' },
  { nameIs: 'Húsfélagsgjöld (innborgun)', nameEn: 'HOA fees (income)', icon: 'Banknote', color: 'green', slug: 'husfelagsgjold-innborgun', isIncome: true },
  { nameIs: 'Óflokkaðar færslur', nameEn: 'Uncategorized', icon: 'HelpCircle', color: 'neutral', slug: 'oflokkad' },
];

const COLOR_MAP: Record<string, { badge: string; bg: string; text: string }> = {
  blue: { badge: 'bg-blue-100 text-blue-800', bg: 'bg-blue-400', text: 'text-blue-100' },
  red: { badge: 'bg-red-100 text-red-800', bg: 'bg-red-400', text: 'text-red-100' },
  green: { badge: 'bg-green-100 text-green-800', bg: 'bg-green-400', text: 'text-green-100' },
  yellow: { badge: 'bg-yellow-100 text-yellow-800', bg: 'bg-yellow-400', text: 'text-yellow-100' },
  purple: { badge: 'bg-purple-100 text-purple-800', bg: 'bg-purple-400', text: 'text-purple-100' },
  orange: { badge: 'bg-orange-100 text-orange-800', bg: 'bg-orange-400', text: 'text-orange-100' },
  pink: { badge: 'bg-pink-100 text-pink-800', bg: 'bg-pink-400', text: 'text-pink-100' },
  indigo: { badge: 'bg-indigo-100 text-indigo-800', bg: 'bg-indigo-400', text: 'text-indigo-100' },
  teal: { badge: 'bg-teal-100 text-teal-800', bg: 'bg-teal-400', text: 'text-teal-100' },
  cyan: { badge: 'bg-cyan-100 text-cyan-800', bg: 'bg-cyan-400', text: 'text-cyan-100' },
  gray: { badge: 'bg-gray-100 text-gray-800', bg: 'bg-gray-400', text: 'text-gray-100' },
  neutral: { badge: 'bg-gray-100 text-gray-800', bg: 'bg-gray-400', text: 'text-gray-100' },
};

export function getCategoryColor(color: string | null | undefined): { badge: string; bg: string; text: string } {
  return COLOR_MAP[color ?? 'gray'] ?? COLOR_MAP.gray;
}

export function formatIskAmount(amount: number, short?: boolean): string {
  const formatted = amount.toLocaleString('is-IS', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return short ? `${formatted} kr.` : `${formatted} kr.`;
}
