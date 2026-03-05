// ============================================================
// useVendorDetail.ts
// Provides detailed statistics for a single vendor/description.
// Used by the vendor detail page to show spending trends,
// monthly history, year totals, and status indicators.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { db } from '@/integrations/supabase/db';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface VendorMonthly {
  month: string;    // yyyy-MM
  total: number;    // absolute ISK amount
}

export interface VendorYearTotal {
  year: number;
  total: number;
}

export interface VendorDetailResult {
  vendor: string;
  totalAmount: number;
  txCount: number;
  avgPerTx: number;
  maxTx: number;
  firstDate: string;
  lastDate: string;
  trendPct: number;         // recent vs previous period % change
  monthlyHistory: VendorMonthly[];
  yearTotals: VendorYearTotal[];
  categoryName: string | null;
  status: 'normal' | 'attention' | 'critical';
  statusText: string;       // Icelandic
}

// ---------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------

interface TxRow {
  id: string;
  date: string;
  amount: number;
  category_id: string | null;
}

interface CategoryRow {
  id: string;
  name_is: string;
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function statusFromTrend(trendPct: number): {
  status: 'normal' | 'attention' | 'critical';
  statusText: string;
} {
  if (trendPct > 20) {
    return {
      status: 'critical',
      statusText: `Útgjöld hækkuðu um ${trendPct.toFixed(1)}% miðað við fyrra tímabil`,
    };
  }
  if (trendPct > 10) {
    return {
      status: 'attention',
      statusText: `Útgjöld hækkuðu um ${trendPct.toFixed(1)}% miðað við fyrra tímabil`,
    };
  }
  if (trendPct < 0) {
    return {
      status: 'normal',
      statusText: `Útgjöld lækkuðu um ${Math.abs(trendPct).toFixed(1)}% miðað við fyrra tímabil`,
    };
  }
  return {
    status: 'normal',
    statusText: `Útgjöld eru stöðug miðað við fyrra tímabil`,
  };
}

// ---------------------------------------------------------------
// Query function
// ---------------------------------------------------------------

async function fetchVendorDetail(
  associationId: string,
  vendorName: string,
): Promise<VendorDetailResult> {
  // Fetch all transactions matching this vendor description
  const { data: txs, error: txError } = await (db as any)
    .from('transactions')
    .select('id, date, amount, category_id')
    .eq('association_id', associationId)
    .eq('description', vendorName)
    .order('date', { ascending: true });

  if (txError) throw txError;

  const transactions: TxRow[] = txs ?? [];

  if (transactions.length === 0) {
    return {
      vendor: vendorName,
      totalAmount: 0,
      txCount: 0,
      avgPerTx: 0,
      maxTx: 0,
      firstDate: '',
      lastDate: '',
      trendPct: 0,
      monthlyHistory: [],
      yearTotals: [],
      categoryName: null,
      status: 'normal',
      statusText: 'Engar færslur fundust',
    };
  }

  // Absolute amounts (vendor spend)
  const amounts = transactions.map((t) => Math.abs(t.amount));
  const totalAmount = amounts.reduce((s, a) => s + a, 0);
  const txCount = transactions.length;
  const avgPerTx = txCount > 0 ? totalAmount / txCount : 0;
  const maxTx = Math.max(...amounts);
  const firstDate = transactions[0].date;
  const lastDate = transactions[transactions.length - 1].date;

  // Monthly history
  const monthMap: Record<string, number> = {};
  transactions.forEach((t) => {
    const month = format(new Date(t.date), 'yyyy-MM');
    monthMap[month] = (monthMap[month] ?? 0) + Math.abs(t.amount);
  });
  const monthlyHistory: VendorMonthly[] = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  // Year totals
  const yearMap: Record<number, number> = {};
  transactions.forEach((t) => {
    const year = new Date(t.date).getFullYear();
    yearMap[year] = (yearMap[year] ?? 0) + Math.abs(t.amount);
  });
  const yearTotals: VendorYearTotal[] = Object.entries(yearMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, total]) => ({ year: Number(year), total }));

  // Trend: compare last 6 months vs prior 6 months
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const twelveMonthsAgo = subMonths(now, 12);

  const recentTotal = transactions
    .filter((t) => new Date(t.date) >= sixMonthsAgo)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const priorTotal = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d >= twelveMonthsAgo && d < sixMonthsAgo;
    })
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const trendPct =
    priorTotal > 0 ? ((recentTotal - priorTotal) / priorTotal) * 100 : 0;

  // Category name (use the most common category_id among transactions)
  let categoryName: string | null = null;
  const catFreq: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.category_id) {
      catFreq[t.category_id] = (catFreq[t.category_id] ?? 0) + 1;
    }
  });
  const topCatId = Object.entries(catFreq).sort(([, a], [, b]) => b - a)[0]?.[0];

  if (topCatId) {
    const { data: catData } = await (db as any)
      .from('categories')
      .select('id, name_is')
      .eq('id', topCatId)
      .single();

    const cat = catData as CategoryRow | null;
    if (cat) {
      categoryName = cat.name_is;
    }
  }

  const { status, statusText } = statusFromTrend(trendPct);

  return {
    vendor: vendorName,
    totalAmount,
    txCount,
    avgPerTx,
    maxTx,
    firstDate,
    lastDate,
    trendPct,
    monthlyHistory,
    yearTotals,
    categoryName,
    status,
    statusText,
  };
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------

/**
 * useVendorDetail
 *
 * Fetches and computes detailed statistics for a single vendor
 * (identified by transaction description) within an association.
 *
 * @param associationId - The association UUID
 * @param vendorName    - The transaction description (vendor name)
 *
 * @example
 * const { data, isLoading } = useVendorDetail(assocId, 'Hitaveita Reykjavíkur');
 * // data.totalAmount, data.trendPct, data.monthlyHistory, ...
 */
export function useVendorDetail(
  associationId: string | null | undefined,
  vendorName: string | null | undefined,
) {
  return useQuery<VendorDetailResult>({
    queryKey: ['vendor_detail', associationId, vendorName],
    queryFn: () => fetchVendorDetail(associationId!, vendorName!),
    enabled: Boolean(associationId) && Boolean(vendorName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
