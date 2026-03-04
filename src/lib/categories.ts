// ============================================================
// Category color helpers and ISK formatting
// Names MUST match the DB seed in 001_full_schema.sql exactly
// ============================================================

export interface CategoryConfig {
  nameIs: string;
  nameEn: string;
  icon: string;
  color: string;
  slug: string;
  isIncome?: boolean;
}

/**
 * These names match the DB `categories` table seed exactly.
 * If you change a name here, update the migration INSERT too.
 */
export const CATEGORIES: CategoryConfig[] = [
  { nameIs: 'Rafmagn & Hiti', nameEn: 'Electricity & Heat', icon: 'Zap', color: 'amber', slug: 'rafmagn-hiti' },
  { nameIs: 'Vatnsveita', nameEn: 'Water', icon: 'Droplets', color: 'blue', slug: 'vatnsveita' },
  { nameIs: 'Tryggingar', nameEn: 'Insurance', icon: 'Shield', color: 'indigo', slug: 'tryggingar' },
  { nameIs: 'Viðhald & Viðgerðir', nameEn: 'Maintenance', icon: 'Wrench', color: 'orange', slug: 'vidhald' },
  { nameIs: 'Garðyrkja & Umhverfi', nameEn: 'Landscaping', icon: 'Flower2', color: 'green', slug: 'gardyrkja' },
  { nameIs: 'Öryggisgæsla', nameEn: 'Security', icon: 'Lock', color: 'red', slug: 'oryggisgaesla' },
  { nameIs: 'Ræsting & Þrif', nameEn: 'Cleaning', icon: 'Sparkles', color: 'purple', slug: 'raesting' },
  { nameIs: 'Lyftuþjónusta', nameEn: 'Elevator Service', icon: 'ArrowUpDown', color: 'gray', slug: 'lyfta' },
  { nameIs: 'Húsfélagsgjöld (innborgun)', nameEn: 'HOA Fees (Income)', icon: 'Banknote', color: 'emerald', slug: 'husfelagsgjold-innborgun', isIncome: true },
  { nameIs: 'Vaxtakostnaður', nameEn: 'Interest Expense', icon: 'TrendingDown', color: 'slate', slug: 'vaxtakostnadur' },
  { nameIs: 'Umsýsla & Stjórnun', nameEn: 'Administration', icon: 'ClipboardList', color: 'teal', slug: 'umsysla' },
  { nameIs: 'Sorpmeðhöndlun', nameEn: 'Waste Management', icon: 'Trash2', color: 'lime', slug: 'sorpmedihoendlun' },
  { nameIs: 'Pípulagnir', nameEn: 'Plumbing', icon: 'Pipette', color: 'cyan', slug: 'pipulagnir' },
  { nameIs: 'Málning & Frágangsvinna', nameEn: 'Painting', icon: 'Palette', color: 'pink', slug: 'malning' },
  { nameIs: 'Lóðaleiga / Fasteignagjöld', nameEn: 'Land Lease / Property Tax', icon: 'Home', color: 'stone', slug: 'lodaleiga' },
  { nameIs: 'Sameign & Sameiginlegur kostnaður', nameEn: 'Common Expenses', icon: 'Building', color: 'sky', slug: 'sameign' },
  { nameIs: 'Annað', nameEn: 'Other', icon: 'HelpCircle', color: 'neutral', slug: 'annad' },
  { nameIs: 'Óflokkað', nameEn: 'Uncategorized', icon: 'AlertTriangle', color: 'yellow', slug: 'oflokkad' },
];

/**
 * Full COLOR_MAP — every Tailwind color used by any category.
 * Uses hardcoded Tailwind classes to avoid dynamic class purging.
 */
const COLOR_MAP: Record<string, { badge: string; bg: string; text: string; hex: string }> = {
  amber:   { badge: 'bg-amber-100 text-amber-800',   bg: 'bg-amber-400',   text: 'text-amber-100',   hex: '#f59e0b' },
  blue:    { badge: 'bg-blue-100 text-blue-800',     bg: 'bg-blue-400',    text: 'text-blue-100',    hex: '#3b82f6' },
  indigo:  { badge: 'bg-indigo-100 text-indigo-800', bg: 'bg-indigo-400',  text: 'text-indigo-100',  hex: '#6366f1' },
  orange:  { badge: 'bg-orange-100 text-orange-800', bg: 'bg-orange-400',  text: 'text-orange-100',  hex: '#f97316' },
  green:   { badge: 'bg-green-100 text-green-800',   bg: 'bg-green-400',   text: 'text-green-100',   hex: '#22c55e' },
  red:     { badge: 'bg-red-100 text-red-800',       bg: 'bg-red-400',     text: 'text-red-100',     hex: '#ef4444' },
  purple:  { badge: 'bg-purple-100 text-purple-800', bg: 'bg-purple-400',  text: 'text-purple-100',  hex: '#a855f7' },
  gray:    { badge: 'bg-gray-100 text-gray-800',     bg: 'bg-gray-400',    text: 'text-gray-100',    hex: '#9ca3af' },
  emerald: { badge: 'bg-emerald-100 text-emerald-800', bg: 'bg-emerald-400', text: 'text-emerald-100', hex: '#10b981' },
  slate:   { badge: 'bg-slate-100 text-slate-800',   bg: 'bg-slate-400',   text: 'text-slate-100',   hex: '#64748b' },
  teal:    { badge: 'bg-teal-100 text-teal-800',     bg: 'bg-teal-400',    text: 'text-teal-100',    hex: '#14b8a6' },
  lime:    { badge: 'bg-lime-100 text-lime-800',     bg: 'bg-lime-400',    text: 'text-lime-100',    hex: '#84cc16' },
  cyan:    { badge: 'bg-cyan-100 text-cyan-800',     bg: 'bg-cyan-400',    text: 'text-cyan-100',    hex: '#06b6d4' },
  pink:    { badge: 'bg-pink-100 text-pink-800',     bg: 'bg-pink-400',    text: 'text-pink-100',    hex: '#ec4899' },
  stone:   { badge: 'bg-stone-100 text-stone-800',   bg: 'bg-stone-400',   text: 'text-stone-100',   hex: '#a8a29e' },
  sky:     { badge: 'bg-sky-100 text-sky-800',       bg: 'bg-sky-400',     text: 'text-sky-100',     hex: '#38bdf8' },
  yellow:  { badge: 'bg-yellow-100 text-yellow-800', bg: 'bg-yellow-400',  text: 'text-yellow-100',  hex: '#eab308' },
  neutral: { badge: 'bg-gray-100 text-gray-800',     bg: 'bg-gray-400',    text: 'text-gray-100',    hex: '#9ca3af' },
};

export function getCategoryColor(color: string | null | undefined): { badge: string; bg: string; text: string; hex: string } {
  return COLOR_MAP[color ?? 'gray'] ?? COLOR_MAP.gray;
}

/**
 * Get the hex color for a category color string (for charts)
 */
export function getCategoryHex(color: string | null | undefined): string {
  return (COLOR_MAP[color ?? 'gray'] ?? COLOR_MAP.gray).hex;
}

export function formatIskAmount(amount: number, short?: boolean): string {
  const formatted = amount.toLocaleString('is-IS', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return short ? `${formatted} kr.` : `${formatted} kr.`;
}
