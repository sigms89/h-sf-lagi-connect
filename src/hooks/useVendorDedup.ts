// ============================================================
// useVendorDedup.ts
// Finds duplicate/similar vendor names using fuzzy matching and
// provides merge + dismiss actions. Uses local Levenshtein
// implementation - no external library required.
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { db } from '@/integrations/supabase/db';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface DedupSuggestion {
  id: string;
  vendorA: string;
  vendorB: string;
  countA: number;
  countB: number;
  totalA: number;
  totalB: number;
  similarity: number;  // 0–1
  reason: string;      // Icelandic explanation
}

// ---------------------------------------------------------------
// Vendor aggregate from transactions
// ---------------------------------------------------------------

interface VendorAggregate {
  description: string;
  count: number;
  total: number;
}

// ---------------------------------------------------------------
// Levenshtein distance (inline implementation)
// ---------------------------------------------------------------

/**
 * Computes the Levenshtein edit distance between two strings.
 * Time complexity O(n*m) with O(min(n,m)) space.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use two rolling arrays to save memory
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,        // insertion
        prev[j] + 1,             // deletion
        prev[j - 1] + cost,      // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

// ---------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------

/**
 * Normalise a vendor string for fuzzy comparison:
 * - trim whitespace
 * - lowercase
 * - remove trailing dots
 * - collapse multiple spaces to one
 */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.+$/, '')
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------
// Similarity calculation
// ---------------------------------------------------------------

interface SimilarityResult {
  similarity: number;
  reason: string;
}

function computeSimilarity(normA: string, normB: string): SimilarityResult | null {
  // Rule 1: normalized identical
  if (normA === normB) {
    return { similarity: 1.0, reason: 'Nöfn eru eins eftir stöðlun' };
  }

  // Rule 2: one contains the other
  if (normA.includes(normB) || normB.includes(normA)) {
    return { similarity: 0.9, reason: 'Annað nafnið inniheldur hitt' };
  }

  // Rule 3: Levenshtein distance ≤ 2
  const dist = levenshtein(normA, normB);
  if (dist <= 2) {
    return {
      similarity: 0.8,
      reason: `Mjög lík nöfn (${dist} stafa munur)`,
    };
  }

  // Rule 4: same first 10 chars + similar length (±3)
  const prefix10A = normA.slice(0, 10);
  const prefix10B = normB.slice(0, 10);
  const lenDiff = Math.abs(normA.length - normB.length);
  if (prefix10A === prefix10B && lenDiff <= 3) {
    return {
      similarity: 0.7,
      reason: 'Sama upphaf og svipað lengd',
    };
  }

  return null;
}

// ---------------------------------------------------------------
// Pair generator
// ---------------------------------------------------------------

function generateSuggestions(vendors: VendorAggregate[]): DedupSuggestion[] {
  const suggestions: DedupSuggestion[] = [];

  for (let i = 0; i < vendors.length; i++) {
    for (let j = i + 1; j < vendors.length; j++) {
      const a = vendors[i];
      const b = vendors[j];
      const normA = normalize(a.description);
      const normB = normalize(b.description);

      const result = computeSimilarity(normA, normB);
      if (result && result.similarity >= 0.7) {
        suggestions.push({
          id: `${i}-${j}`,
          vendorA: a.description,
          vendorB: b.description,
          countA: a.count,
          countB: b.count,
          totalA: a.total,
          totalB: b.total,
          similarity: result.similarity,
          reason: result.reason,
        });
      }
    }
  }

  // Sort by similarity descending, then by combined count descending
  return suggestions.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return b.countA + b.countB - (a.countA + a.countB);
  });
}

// ---------------------------------------------------------------
// Query function - fetch unique vendor descriptions with aggregates
// ---------------------------------------------------------------

async function fetchVendorAggregates(associationId: string): Promise<VendorAggregate[]> {
  const { data, error } = await (db as any)
    .from('transactions')
    .select('description, amount')
    .eq('association_id', associationId)
    .not('description', 'is', null);

  if (error) throw error;

  // Group by description
  const map: Record<string, { count: number; total: number }> = {};
  for (const row of data ?? []) {
    const desc: string = row.description ?? '';
    if (!desc) continue;
    if (!map[desc]) {
      map[desc] = { count: 0, total: 0 };
    }
    map[desc].count++;
    map[desc].total += Math.abs(row.amount ?? 0);
  }

  return Object.entries(map).map(([description, { count, total }]) => ({
    description,
    count,
    total,
  }));
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------

/**
 * useVendorDedup
 *
 * Detects likely duplicate vendor names in the association's
 * transactions using normalization + fuzzy matching rules.
 * Provides merge and dismiss actions.
 *
 * @param associationId - The association UUID
 *
 * @example
 * const { data, isLoading, mergeVendors, dismissSuggestion } = useVendorDedup(assocId);
 * // data is DedupSuggestion[]
 * // await mergeVendors('Hitaveita Reykjavíkur', 'Hitaveita Rvk.')
 * // dismissSuggestion('0-3')
 */
export function useVendorDedup(associationId: string | null | undefined): {
  data: DedupSuggestion[];
  isLoading: boolean;
  mergeVendors: (keep: string, remove: string) => Promise<void>;
  dismissSuggestion: (id: string) => void;
} {
  const queryClient = useQueryClient();

  // Dismissed suggestion IDs (local state only)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Fetch vendor aggregates
  const { data: aggregates, isLoading } = useQuery<VendorAggregate[]>({
    queryKey: ['vendor_aggregates', associationId],
    queryFn: () => fetchVendorAggregates(associationId!),
    enabled: Boolean(associationId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Compute suggestions (memoized - only recompute when aggregates change)
  const allSuggestions = useMemo<DedupSuggestion[]>(
    () => (aggregates ? generateSuggestions(aggregates) : []),
    [aggregates],
  );

  // Filter out dismissed suggestions
  const data = useMemo(
    () => allSuggestions.filter((s) => !dismissed.has(s.id)),
    [allSuggestions, dismissed],
  );

  // ---------------------------------------------------------------
  // mergeVendors: rewrite all transactions from `remove` → `keep`
  // ---------------------------------------------------------------
  const mergeVendors = async (keep: string, remove: string): Promise<void> => {
    if (!associationId) return;

    try {
      const { error } = await (db as any)
        .from('transactions')
        .update({ description: keep })
        .eq('description', remove)
        .eq('association_id', associationId);

      if (error) throw error;

      toast.success(`Sameinað: „${remove}" er nú „${keep}"`);

      // Invalidate all query keys that might have stale vendor data
      await queryClient.invalidateQueries({ queryKey: ['vendor_aggregates', associationId] });
      await queryClient.invalidateQueries({ queryKey: ['vendor_detail', associationId] });
      await queryClient.invalidateQueries({ queryKey: ['transactions', associationId] });
    } catch (err) {
      toast.error('Villa kom upp við sameininguna. Reyndu aftur.');
      throw err;
    }
  };

  // ---------------------------------------------------------------
  // dismissSuggestion: hide a suggestion locally (no DB write)
  // ---------------------------------------------------------------
  const dismissSuggestion = (id: string): void => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  return { data, isLoading, mergeVendors, dismissSuggestion };
}
