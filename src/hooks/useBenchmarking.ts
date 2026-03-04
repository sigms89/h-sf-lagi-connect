// ============================================================
// Húsfélagið.is — Benchmarking Hooks
// TanStack Query hooks for benchmarking / comparison data
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { CATEGORIES } from '@/lib/categories';

// ============================================================
// TYPES
// ============================================================

export type BenchmarkStatus = 'below' | 'average' | 'above';

export interface BenchmarkRow {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  yourCostPerUnit: number;
  avgCostPerUnit: number;
  diff: number;         // absolute difference
  diffPercent: number;  // signed percentage vs average
  percentile: number;   // 0-100
  status: BenchmarkStatus;
}

export interface BenchmarkFilters {
  buildingType: 'all' | 'fjolbyli' | 'radhus' | 'parhus';
  minUnits: number;
  maxUnits: number;
  postalPrefix: string; // e.g. '1' for 100-199
  buildingYearFrom: number;
  buildingYearTo: number;
}

export const DEFAULT_BENCHMARK_FILTERS: BenchmarkFilters = {
  buildingType: 'all',
  minUnits: 2,
  maxUnits: 200,
  postalPrefix: 'all',
  buildingYearFrom: 1900,
  buildingYearTo: new Date().getFullYear(),
};

// ============================================================
// QUERY KEYS
// ============================================================
export const BENCHMARK_KEYS = {
  all: ['benchmarking'] as const,
  data: (assocId: string, filters: BenchmarkFilters) =>
    [...BENCHMARK_KEYS.all, assocId, filters] as const,
  comparableCount: (filters: BenchmarkFilters) =>
    [...BENCHMARK_KEYS.all, 'count', filters] as const,
};

// ============================================================
// useBenchmarkData
// Fetches comparison data: your cost per unit vs anonymised avg
// ============================================================
export function useBenchmarkData(
  associationId: string | null | undefined,
  numUnits: number | undefined,
  filters: BenchmarkFilters
) {
  return useQuery({
    queryKey: BENCHMARK_KEYS.data(associationId ?? '', filters),
    queryFn: async (): Promise<BenchmarkRow[]> => {
      if (!associationId || !numUnits || numUnits < 1) return [];

      // 1. Get current association's transactions (last 12 months, expenses only)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      const fromDate = twelveMonthsAgo.toISOString().slice(0, 10);

      const { data: myTx, error: myError } = await db
        .from('transactions')
        .select('category_id, amount, categories(id, name_is, color)')
        .eq('association_id', associationId)
        .eq('is_income', false)
        .lt('amount', 0)
        .gte('date', fromDate);

      if (myError) throw myError;

      // 2. Get all other associations matching filters (anonymised)
      let otherAssocQuery = db
        .from('associations')
        .select('id, num_units, type, postal_code')
        .neq('id', associationId)
        .gte('num_units', filters.minUnits)
        .lte('num_units', filters.maxUnits);

      if (filters.buildingType !== 'all') {
        otherAssocQuery = otherAssocQuery.eq('type', filters.buildingType);
      }

      const { data: otherAssocs, error: assocError } = await otherAssocQuery;
      if (assocError) throw assocError;

      // Filter by postal prefix client-side
      const filteredAssocs = (otherAssocs ?? []).filter((a) => {
        if (filters.postalPrefix === 'all') return true;
        return (a.postal_code ?? '').startsWith(filters.postalPrefix);
      });

      const otherAssocIds = filteredAssocs.map((a: { id: string }) => a.id);

      // 3. Get transactions for other associations (last 12 months)
      let otherTxList: Array<{
        association_id: string;
        category_id: string | null;
        amount: number;
      }> = [];

      if (otherAssocIds.length > 0) {
        const { data: otherTx, error: otherError } = await db
          .from('transactions')
          .select('association_id, category_id, amount')
          .in('association_id', otherAssocIds)
          .eq('is_income', false)
          .lt('amount', 0)
          .gte('date', fromDate);

        if (otherError) throw otherError;
        otherTxList = otherTx ?? [];
      }

      // 4. Build aggregation by category
      // My totals per category
      const myTotals = new Map<string, number>();
      for (const tx of myTx ?? []) {
        if (!tx.category_id) continue;
        myTotals.set(tx.category_id, (myTotals.get(tx.category_id) ?? 0) + Math.abs(tx.amount));
      }

      // Other assocs: totals per association per category
      type AssocCatTotal = Map<string, Map<string, number>>;
      const otherTotals: AssocCatTotal = new Map();
      for (const tx of otherTxList) {
        if (!tx.category_id) continue;
        if (!otherTotals.has(tx.association_id)) {
          otherTotals.set(tx.association_id, new Map());
        }
        const catMap = otherTotals.get(tx.association_id)!;
        catMap.set(tx.category_id, (catMap.get(tx.category_id) ?? 0) + Math.abs(tx.amount));
      }

      // Map of assocId -> numUnits for the other assocs
      const assocUnits = new Map<string, number>();
      for (const a of filteredAssocs) {
        assocUnits.set(a.id, a.num_units);
      }

      // 5. Build benchmark rows for every category that has data
      const rows: BenchmarkRow[] = [];

      // Get category metadata from transactions (prefer DB data, fall back to CATEGORIES config)
      const catMeta = new Map<string, { name: string; color: string }>();
      for (const tx of myTx ?? []) {
        if (tx.category_id && tx.categories) {
          const cat = tx.categories as { id: string; name_is: string; color: string };
          catMeta.set(tx.category_id, { name: cat.name_is, color: cat.color ?? 'neutral' });
        }
      }

      // Fall back to CATEGORIES config for icon
      const categoryConfigMap = new Map(CATEGORIES.map((c) => [c.nameIs, c]));

      for (const [catId, myTotal] of myTotals.entries()) {
        const myCostPerUnit = myTotal / numUnits / 12; // monthly per unit

        // Average across other assocs (only those that have data for this category)
        const otherCostsPerUnit: number[] = [];
        for (const [assocId, catMap] of otherTotals.entries()) {
          const otherTotal = catMap.get(catId);
          const otherUnits = assocUnits.get(assocId);
          if (otherTotal && otherUnits && otherUnits > 0) {
            otherCostsPerUnit.push(otherTotal / otherUnits / 12);
          }
        }

        if (otherCostsPerUnit.length === 0) continue;

        const avgCostPerUnit =
          otherCostsPerUnit.reduce((sum, v) => sum + v, 0) / otherCostsPerUnit.length;

        const diff = myCostPerUnit - avgCostPerUnit;
        const diffPercent = avgCostPerUnit > 0 ? (diff / avgCostPerUnit) * 100 : 0;

        // Percentile: how many other assocs are cheaper than me
        const cheaper = otherCostsPerUnit.filter((v) => v < myCostPerUnit).length;
        const percentile = Math.round((cheaper / otherCostsPerUnit.length) * 100);

        const status: BenchmarkStatus =
          diffPercent <= -10 ? 'below' : diffPercent >= 10 ? 'above' : 'average';

        const meta = catMeta.get(catId);
        const catConfig = meta ? categoryConfigMap.get(meta.name) : undefined;

        rows.push({
          categoryId: catId,
          categoryName: meta?.name ?? 'Óþekkt flokkur',
          categoryColor: meta?.color ?? 'neutral',
          categoryIcon: catConfig?.icon ?? 'HelpCircle',
          yourCostPerUnit: myCostPerUnit,
          avgCostPerUnit,
          diff,
          diffPercent,
          percentile,
          status,
        });
      }

      // Sort by biggest absolute difference first
      return rows.sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));
    },
    enabled: !!associationId && !!numUnits,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// useComparableCount
// Number of comparable associations matching the current filters
// ============================================================
export function useComparableCount(
  associationId: string | null | undefined,
  filters: BenchmarkFilters
) {
  return useQuery({
    queryKey: BENCHMARK_KEYS.comparableCount(filters),
    queryFn: async (): Promise<number> => {
      if (!associationId) return 0;

      let query = db
        .from('associations')
        .select('id', { count: 'exact', head: true })
        .neq('id', associationId)
        .gte('num_units', filters.minUnits)
        .lte('num_units', filters.maxUnits);

      if (filters.buildingType !== 'all') {
        query = query.eq('type', filters.buildingType);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!associationId,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// useBenchmarkFilters
// Local state management for benchmark filter bar
// ============================================================
export function useBenchmarkFilters() {
  const [filters, setFilters] = useState<BenchmarkFilters>(DEFAULT_BENCHMARK_FILTERS);

  const updateFilter = <K extends keyof BenchmarkFilters>(
    key: K,
    value: BenchmarkFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_BENCHMARK_FILTERS);

  return { filters, updateFilter, resetFilters };
}
