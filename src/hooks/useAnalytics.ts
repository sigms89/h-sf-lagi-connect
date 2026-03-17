// ============================================================
// Húsfélagið.is: useAnalytics: Extended Analytics Hooks
// Provides vendor analysis, year-over-year comparison,
// and fee adequacy calculations.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { subMonths, format, startOfYear, endOfYear, subYears } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VendorStat {
  vendor: string;
  count: number;
  total: number;
  avgPerTx: number;
  trend: 'up' | 'down' | 'flat';
}

export interface YearOverYearRow {
  category: string;
  color: string;
  thisYear: number;
  lastYear: number;
  change: number; // percentage, positive = increase
}

export interface FeeAdequacy {
  monthlyIncome: number;
  monthlyExpenses: number;
  deficit: number; // positive = overspending
  neededIncrease: number; // kr/unit/month
  isAdequate: boolean;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const ANALYTICS_KEYS = {
  vendors: (assocId: string, dateFrom?: string | null) => ['analytics', 'vendors', assocId, dateFrom ?? 'all'] as const,
  yoy: (assocId: string) => ['analytics', 'yoy', assocId] as const,
  feeAdequacy: (assocId: string, numUnits: number) =>
    ['analytics', 'fee_adequacy', assocId, numUnits] as const,
};

// ── Hook: useVendorAnalytics ──────────────────────────────────────────────────

export function useVendorAnalytics(associationId: string | null | undefined, dateFrom?: string | null) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.vendors(associationId ?? '', dateFrom),
    queryFn: async (): Promise<VendorStat[]> => {
      if (!associationId) return [];

      // Fetch expense transactions with optional date filter
      let query = db
        .from('transactions')
        .select('id, date, description, amount, is_income')
        .eq('association_id', associationId)
        .eq('is_income', false)
        .order('date', { ascending: true })
        .limit(10000);

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (error) throw error;

      const transactions: { id: string; date: string; description: string; amount: number }[] =
        (data ?? []).filter((t: any) => t.amount < 0);

      // Aggregate by vendor description
      const vendorMap = new Map<
        string,
        { count: number; total: number; monthly: Map<string, number> }
      >();

      for (const tx of transactions) {
        const key = tx.description.trim();
        if (!vendorMap.has(key)) {
          vendorMap.set(key, { count: 0, total: 0, monthly: new Map() });
        }
        const entry = vendorMap.get(key)!;
        entry.count += 1;
        entry.total += Math.abs(tx.amount);
        const mk = tx.date.slice(0, 7);
        entry.monthly.set(mk, (entry.monthly.get(mk) ?? 0) + Math.abs(tx.amount));
      }

      const results: VendorStat[] = [];

      for (const [vendor, { count, total, monthly }] of vendorMap) {
        const avgPerTx = count > 0 ? total / count : 0;

        // Trend: compare last 3 months avg vs previous 3 months avg
        const sortedMonths = Array.from(monthly.keys()).sort();
        let trend: 'up' | 'down' | 'flat' = 'flat';

        if (sortedMonths.length >= 6) {
          const last3 = sortedMonths.slice(-3).map((m) => monthly.get(m) ?? 0);
          const prev3 = sortedMonths.slice(-6, -3).map((m) => monthly.get(m) ?? 0);
          const recentAvg = last3.reduce((a, b) => a + b, 0) / 3;
          const prevAvg = prev3.reduce((a, b) => a + b, 0) / 3;
          if (prevAvg > 0) {
            const pct = ((recentAvg - prevAvg) / prevAvg) * 100;
            if (pct > 5) trend = 'up';
            else if (pct < -5) trend = 'down';
          }
        }

        results.push({ vendor, count, total, avgPerTx, trend });
      }

      // Sort by total descending, return top 10
      return results.sort((a, b) => b.total - a.total).slice(0, 10);
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Hook: useYearOverYear ─────────────────────────────────────────────────────

export function useYearOverYear(associationId: string | null | undefined) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.yoy(associationId ?? ''),
    queryFn: async (): Promise<YearOverYearRow[]> => {
      if (!associationId) return [];

      const now = new Date();
      const thisYearStart = format(startOfYear(now), 'yyyy-MM-dd');
      const thisYearEnd = format(endOfYear(now), 'yyyy-MM-dd');
      const lastYearStart = format(startOfYear(subYears(now, 1)), 'yyyy-MM-dd');
      const lastYearEnd = format(endOfYear(subYears(now, 1)), 'yyyy-MM-dd');

      // Fetch expense transactions for this year and last year
      const { data, error } = await db
        .from('transactions')
        .select('date, amount, is_income, category_id, category:categories(id, name_is, color)')
        .eq('association_id', associationId)
        .eq('is_income', false)
        .gte('date', lastYearStart)
        .lte('date', thisYearEnd)
        .order('date', { ascending: true })
        .limit(10000);

      if (error) throw error;

      const transactions: Array<{
        date: string;
        amount: number;
        category_id: string | null;
        category: { id: string; name_is: string; color: string } | null;
      }> = (data ?? []).filter((t: any) => t.amount < 0);

      // Accumulate by category × year
      const catMap = new Map<
        string,
        { name: string; color: string; thisYear: number; lastYear: number }
      >();

      for (const tx of transactions) {
        const catId = tx.category_id ?? 'uncategorized';
        const catName = tx.category?.name_is ?? 'Óflokkað';
        const catColor = tx.category?.color ?? 'yellow';

        if (!catMap.has(catId)) {
          catMap.set(catId, { name: catName, color: catColor, thisYear: 0, lastYear: 0 });
        }
        const entry = catMap.get(catId)!;
        const amt = Math.abs(tx.amount);

        if (tx.date >= thisYearStart && tx.date <= thisYearEnd) {
          entry.thisYear += amt;
        } else if (tx.date >= lastYearStart && tx.date <= lastYearEnd) {
          entry.lastYear += amt;
        }
      }

      // Only return categories with data in BOTH years
      const rows: YearOverYearRow[] = [];
      for (const [, { name, color, thisYear, lastYear }] of catMap) {
        if (thisYear === 0 || lastYear === 0) continue;
        const change = ((thisYear - lastYear) / lastYear) * 100;
        rows.push({ category: name, color, thisYear, lastYear, change });
      }

      return rows.sort((a, b) => b.thisYear - a.thisYear);
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Hook: useFeeAdequacy ──────────────────────────────────────────────────────

export function useFeeAdequacy(
  associationId: string | null | undefined,
  numUnits: number
) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.feeAdequacy(associationId ?? '', numUnits),
    queryFn: async (): Promise<FeeAdequacy> => {
      const empty: FeeAdequacy = {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        deficit: 0,
        neededIncrease: 0,
        isAdequate: true,
      };

      if (!associationId) return empty;

      const twelveMonthsAgo = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

      const { data, error } = await db
        .from('transactions')
        .select('date, amount, is_income')
        .eq('association_id', associationId)
        .gte('date', twelveMonthsAgo)
        .limit(10000);

      if (error) throw error;

      let totalIncome = 0;
      let totalExpenses = 0;

      for (const tx of data ?? []) {
        if ((tx as any).is_income || (tx as any).amount > 0) {
          totalIncome += Math.abs((tx as any).amount);
        } else {
          totalExpenses += Math.abs((tx as any).amount);
        }
      }

      const monthlyIncome = totalIncome / 12;
      const monthlyExpenses = totalExpenses / 12;
      const deficit = monthlyExpenses - monthlyIncome;
      const neededIncrease = deficit > 0 && numUnits > 0 ? deficit / numUnits : 0;

      return {
        monthlyIncome,
        monthlyExpenses,
        deficit,
        neededIncrease,
        isAdequate: deficit <= 0,
      };
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
