// ============================================================
// Category color helpers and ISK formatting
// ============================================================

const COLOR_MAP: Record<string, { badge: string; bg: string }> = {
  blue: { badge: 'bg-blue-100 text-blue-800', bg: 'bg-blue-400' },
  red: { badge: 'bg-red-100 text-red-800', bg: 'bg-red-400' },
  green: { badge: 'bg-green-100 text-green-800', bg: 'bg-green-400' },
  yellow: { badge: 'bg-yellow-100 text-yellow-800', bg: 'bg-yellow-400' },
  purple: { badge: 'bg-purple-100 text-purple-800', bg: 'bg-purple-400' },
  orange: { badge: 'bg-orange-100 text-orange-800', bg: 'bg-orange-400' },
  pink: { badge: 'bg-pink-100 text-pink-800', bg: 'bg-pink-400' },
  indigo: { badge: 'bg-indigo-100 text-indigo-800', bg: 'bg-indigo-400' },
  teal: { badge: 'bg-teal-100 text-teal-800', bg: 'bg-teal-400' },
  cyan: { badge: 'bg-cyan-100 text-cyan-800', bg: 'bg-cyan-400' },
  gray: { badge: 'bg-gray-100 text-gray-800', bg: 'bg-gray-400' },
  neutral: { badge: 'bg-gray-100 text-gray-800', bg: 'bg-gray-400' },
};

export function getCategoryColor(color: string): { badge: string; bg: string } {
  return COLOR_MAP[color] ?? COLOR_MAP.gray;
}

export function formatIskAmount(amount: number): string {
  return amount.toLocaleString('is-IS', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' kr.';
}
