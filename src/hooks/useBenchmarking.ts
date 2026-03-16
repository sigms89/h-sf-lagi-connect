// ============================================================
// Húsfélagið.is — Benchmarking Hooks
// TanStack Query hooks for benchmarking / comparison data
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// TYPES
// ============================================================

export type BenchmarkStatus = 'below' | 'average' | 'above' | 'insufficient';

export type BenchmarkRegion = 'local' | 'capital_vs_rural' | 'all';

export interface BenchmarkRow {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  yourCostPerUnit: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  avgCostPerUnit: number | null;
  diff: number | null;
  diffPercent: number | null;
  percentile: number | null;
  status: BenchmarkStatus;
  comparableInCategory: number;
}

export interface BenchmarkFilters {
  buildingType: 'all' | 'fjolbyli' | 'radhus' | 'parhus';
  minUnits: number;
  maxUnits: number;
  region: BenchmarkRegion;
  buildingYearFrom: number;
  buildingYearTo: number;
}

export const DEFAULT_BENCHMARK_FILTERS: BenchmarkFilters = {
  buildingType: 'all',
  minUnits: 2,
  maxUnits: 200,
  region: 'all',
  buildingYearFrom: 1900,
  buildingYearTo: new Date().getFullYear(),
};

// ============================================================
// Region helpers
// ============================================================

const REGION_LABELS: Record<string, string> = {
  '1': 'Reykjavík',
  '2': 'Kópavogur / Garðabær / Hafnarfjörður',
  '3': 'Akranes / Borgarnes',
  '4': 'Vestfirðir',
  '5': 'Skagafjörður / Húnaþing',
  '6': 'Akureyri / Eyjafjörður',
  '7': 'Austurland',
  '8': 'Suðurland',
  '9': 'Vestmannaeyjar',
};

export function getLocalRegionLabel(postalCode: string | null | undefined): string {
  if (!postalCode || postalCode.length < 1) return 'Mitt svæði';
  const prefix = postalCode.charAt(0);
  const label = REGION_LABELS[prefix];
  return label ? `${label} (${prefix}xx)` : `Svæði ${prefix}xx`;
}

export function isCapitalArea(postalCode: string | null | undefined): boolean {
  if (!postalCode) return false;
  const num = parseInt(postalCode, 10);
  return num >= 100 && num <= 299;
}

export function getRegionGroupLabel(postalCode: string | null | undefined): string {
  return isCapitalArea(postalCode) ? 'Höfuðborgarsvæðið' : 'Landsbyggðin';
}

// ============================================================
// QUERY KEYS
// ============================================================
export const BENCHMARK_KEYS = {
  all: ['benchmarking'] as const,
  data: (assocId: string, filters: BenchmarkFilters) =>
    [...BENCHMARK_KEYS.all, assocId, filters] as const,
  comparableCount: (assocId: string, filters: BenchmarkFilters) =>
    [...BENCHMARK_KEYS.all, 'count', assocId, filters] as const,
};

// ============================================================
// useBenchmarkData
// Calls server-side edge function for anonymised comparison
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

      const { data, error } = await supabase.functions.invoke('benchmark', {
        body: { associationId, filters },
      });

      if (error) throw error;
      return data?.rows ?? [];
    },
    enabled: !!associationId && !!numUnits,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// useComparableCount
// Returns count from the same edge function response
// ============================================================
export function useComparableCount(
  associationId: string | null | undefined,
  filters: BenchmarkFilters
) {
  return useQuery({
    queryKey: BENCHMARK_KEYS.comparableCount(associationId ?? '', filters),
    queryFn: async (): Promise<number> => {
      if (!associationId) return 0;

      const { data, error } = await supabase.functions.invoke('benchmark', {
        body: { associationId, filters },
      });

      if (error) throw error;
      return data?.comparableCount ?? 0;
    },
    enabled: !!associationId,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// useBenchmarkFilters
// Local state management for benchmark filter bar
// ============================================================
export function useBenchmarkFilters(buildingYear?: number | null) {
  const defaultFilters: BenchmarkFilters = {
    ...DEFAULT_BENCHMARK_FILTERS,
    buildingYearFrom: buildingYear ? buildingYear - 10 : 1900,
    buildingYearTo: buildingYear ? buildingYear + 10 : new Date().getFullYear(),
  };

  const [filters, setFilters] = useState<BenchmarkFilters>(defaultFilters);

  const updateFilter = <K extends keyof BenchmarkFilters>(
    key: K,
    value: BenchmarkFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  return { filters, updateFilter, resetFilters };
}
