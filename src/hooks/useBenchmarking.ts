import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';

export interface BenchmarkFilters {
  city?: string;
  buildingYearFrom: number;
  buildingYearTo: number;
  unitCountMin?: number;
  unitCountMax?: number;
}

export interface BenchmarkCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  yourAvg: number | null; // monthly average for this association
  marketAvg: number | null; // monthly average for comparable associations
  marketMin: number | null;
  marketMax: number | null;
  marketMedian: number | null;
  participantCount: number;
}

export const DEFAULT_FILTERS: BenchmarkFilters = {
  buildingYearFrom: 1900,
  buildingYearTo: new Date().getFullYear(),
};

export function useBenchmarkData(
  associationId: string | null | undefined,
  filters: BenchmarkFilters = DEFAULT_FILTERS
) {
  return useQuery({
    queryKey: ['benchmark-data', associationId, filters],
    queryFn: async (): Promise<BenchmarkCategory[]> => {
      if (!associationId) return [];

      // 1. Fetch this association's own expense stats per category (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      const fromDate = twelveMonthsAgo.toISOString().slice(0, 10);

      const { data: ownTx, error: ownError } = await db
        .from('transactions')
        .select('amount, category_id, category:categories(name_is, color)')
        .eq('association_id', associationId)
        .eq('is_income', false)
        .gte('date', fromDate);

      if (ownError) throw ownError;

      type TxRow = {
        amount: number;
        category_id: string | null;
        category: { name_is: string; color: string | null } | null;
      };

      const ownList = (ownTx ?? []) as TxRow[];

      // Aggregate own totals per category
      const ownCatMap = new Map<
        string,
        { name: string; color: string; total: number }
      >();
      for (const tx of ownList) {
        if (!tx.category_id) continue;
        const e = ownCatMap.get(tx.category_id) ?? {
          name: tx.category?.name_is ?? 'Óþekkt',
          color: tx.category?.color ?? '#1e3a5f',
          total: 0,
        };
        e.total += Math.abs(tx.amount);
        ownCatMap.set(tx.category_id, e);
      }

      // 2. Find comparable associations
      let otherAssocQuery = db
        .from('associations')
        .select('id')
        .neq('id', associationId);

      // Apply city filter
      if (filters.city) {
        otherAssocQuery = otherAssocQuery.eq('city', filters.city);
      }

      // Apply building year filters (fix: actually use the values)
      if (filters.buildingYearFrom > 1900) {
        otherAssocQuery = otherAssocQuery.gte(
          'building_year',
          filters.buildingYearFrom
        );
      }
      if (filters.buildingYearTo < new Date().getFullYear()) {
        otherAssocQuery = otherAssocQuery.lte(
          'building_year',
          filters.buildingYearTo
        );
      }

      // Apply unit count filters
      if (filters.unitCountMin !== undefined) {
        otherAssocQuery = otherAssocQuery.gte(
          'unit_count',
          filters.unitCountMin
        );
      }
      if (filters.unitCountMax !== undefined) {
        otherAssocQuery = otherAssocQuery.lte(
          'unit_count',
          filters.unitCountMax
        );
      }

      const { data: otherAssocs, error: assocError } = await otherAssocQuery;
      if (assocError) throw assocError;

      const otherIds = ((otherAssocs ?? []) as { id: string }[]).map(
        (a) => a.id
      );

      // 3. For each category in our own data, compute market stats
      const results: BenchmarkCategory[] = [];

      for (const [catId, ownCat] of ownCatMap) {
        const ownAvg = ownCat.total / 12;

        if (otherIds.length === 0) {
          results.push({
            categoryId: catId,
            categoryName: ownCat.name,
            categoryColor: ownCat.color,
            yourAvg: ownAvg,
            marketAvg: null,
            marketMin: null,
            marketMax: null,
            marketMedian: null,
            participantCount: 0,
          });
          continue;
        }

        // Fetch other associations' spend for this category
        const { data: otherTx, error: otherError } = await db
          .from('transactions')
          .select('amount, association_id')
          .in('association_id', otherIds)
          .eq('category_id', catId)
          .eq('is_income', false)
          .gte('date', fromDate);

        if (otherError) throw otherError;

        const otherList = (otherTx ?? []) as {
          amount: number;
          association_id: string;
        }[];

        // Aggregate per other association
        const perAssocTotals = new Map<string, number>();
        for (const tx of otherList) {
          perAssocTotals.set(
            tx.association_id,
            (perAssocTotals.get(tx.association_id) ?? 0) +
              Math.abs(tx.amount)
          );
        }

        const monthlyAvgs = Array.from(perAssocTotals.values()).map(
          (t) => t / 12
        );

        if (monthlyAvgs.length === 0) {
          results.push({
            categoryId: catId,
            categoryName: ownCat.name,
            categoryColor: ownCat.color,
            yourAvg: ownAvg,
            marketAvg: null,
            marketMin: null,
            marketMax: null,
            marketMedian: null,
            participantCount: 0,
          });
          continue;
        }

        const sorted = [...monthlyAvgs].sort((a, b) => a - b);
        const marketMin = sorted[0];
        const marketMax = sorted[sorted.length - 1];
        const marketAvg =
          monthlyAvgs.reduce((s, v) => s + v, 0) / monthlyAvgs.length;
        const mid = Math.floor(sorted.length / 2);
        const marketMedian =
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];

        results.push({
          categoryId: catId,
          categoryName: ownCat.name,
          categoryColor: ownCat.color,
          yourAvg: ownAvg,
          marketAvg,
          marketMin,
          marketMax,
          marketMedian,
          participantCount: monthlyAvgs.length,
        });
      }

      return results.sort((a, b) => (b.yourAvg ?? 0) - (a.yourAvg ?? 0));
    },
    enabled: !!associationId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBenchmarkFilters() {
  return {
    defaultFilters: DEFAULT_FILTERS,
  };
}
