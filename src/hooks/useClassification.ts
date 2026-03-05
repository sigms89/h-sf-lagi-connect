// ============================================================
// Húsfélagið.is — Classification Hooks
// Smart vendor summary, bulk re-classification, and auto-classify
// mutations for the transaction categorization engine.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import type { Category, VendorRule } from '@/types/database';
import { TRANSACTION_KEYS } from '@/hooks/useTransactions';
import { CATEGORY_KEYS } from '@/hooks/useCategories';
import { categorizeTransaction } from '@/lib/categorize';
import { useAuth } from '@/hooks/useAuth';

// ============================================================
// QUERY KEYS
// ============================================================

export const CLASSIFICATION_KEYS = {
  all: ['classification'] as const,
  vendorSummary: (associationId: string) =>
    [...CLASSIFICATION_KEYS.all, 'vendor-summary', associationId] as const,
};

// ============================================================
// TYPES
// ============================================================

export interface VendorSummaryItem {
  /** Exact description string used as the vendor key */
  vendor: string;
  /** Number of transactions with this description */
  count: number;
  /** Sum of amounts (positive = net income, negative = net expense) */
  total: number;
  /** Category name currently on the majority of these transactions, or null */
  currentCategory: string | null;
  /** Category name suggested by the rules engine */
  suggestedCategory: string;
  /** Array of transaction IDs belonging to this vendor group */
  transactions: string[];
}

export interface BulkReclassifyInput {
  associationId: string;
  /** The exact description string that identifies this vendor group */
  vendorName: string;
  /** Target category UUID */
  newCategoryId: string;
  /** If true, also create a vendor_rule so future imports are classified automatically */
  createRule?: boolean;
}

export interface RunAutoClassifyInput {
  associationId: string;
  /** 'uncategorized' — only rows with category_id = null
   *  'all' — re-run on every transaction for this association */
  scope: 'uncategorized' | 'all';
}

// ============================================================
// useVendorSummary
// Groups transactions by description, enriches with rule-engine suggestion
// ============================================================

export function useVendorSummary(associationId: string | null | undefined) {
  return useQuery({
    queryKey: CLASSIFICATION_KEYS.vendorSummary(associationId ?? ''),
    queryFn: async (): Promise<VendorSummaryItem[]> => {
      if (!associationId) return [];

      // Fetch all transactions (id, description, amount, category name)
      const { data: txRows, error: txError } = await db
        .from('transactions')
        .select(`id, description, amount, category:categories(name_is)`)
        .eq('association_id', associationId)
        .order('description', { ascending: true });

      if (txError) throw txError;

      // Fetch vendor rules + categories for the rules engine
      const [rulesRes, catsRes] = await Promise.all([
        db
          .from('vendor_rules')
          .select('*')
          .or(`is_global.eq.true,association_id.eq.${associationId}`)
          .order('priority', { ascending: false }),
        db.from('categories').select('*'),
      ]);

      if (rulesRes.error) throw rulesRes.error;
      if (catsRes.error) throw catsRes.error;

      const vendorRules = (rulesRes.data ?? []) as VendorRule[];
      const categories  = (catsRes.data  ?? []) as Category[];

      // Group by description
      const grouped = new Map<
        string,
        { ids: string[]; total: number; categoryNames: string[] }
      >();

      for (const tx of txRows ?? []) {
        const key = (tx.description ?? '').trim();
        const entry = grouped.get(key) ?? { ids: [], total: 0, categoryNames: [] };
        entry.ids.push(tx.id as string);
        entry.total += (tx.amount as number) ?? 0;
        const catName = (tx.category as { name_is: string } | null)?.name_is ?? null;
        if (catName) entry.categoryNames.push(catName);
        grouped.set(key, entry);
      }

      // Build summary items
      const summary: VendorSummaryItem[] = [];

      for (const [vendor, { ids, total, categoryNames }] of grouped.entries()) {
        // Most common category among these transactions
        const freqMap = new Map<string, number>();
        for (const name of categoryNames) freqMap.set(name, (freqMap.get(name) ?? 0) + 1);
        let currentCategory: string | null = null;
        let maxFreq = 0;
        for (const [name, freq] of freqMap.entries()) {
          if (freq > maxFreq) { maxFreq = freq; currentCategory = name; }
        }

        // Representative amount for the engine (use average sign)
        const avgAmount = ids.length > 0 ? total / ids.length : 0;
        const result = categorizeTransaction(vendor, avgAmount, vendorRules, categories);

        summary.push({
          vendor,
          count: ids.length,
          total,
          currentCategory,
          suggestedCategory: result.categoryNameIs,
          transactions: ids,
        });
      }

      // Sort: most transactions first
      summary.sort((a, b) => b.count - a.count);

      return summary;
    },
    enabled: !!associationId,
    staleTime: 3 * 60 * 1000,
  });
}

// ============================================================
// useBulkReclassify
// Updates all transactions for a vendor name to a new category,
// and optionally creates a vendor_rule for future auto-classification.
// ============================================================

export function useBulkReclassify() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      associationId,
      vendorName,
      newCategoryId,
      createRule = false,
    }: BulkReclassifyInput): Promise<{ updated: number; ruleCreated: boolean }> => {
      // 1. Update all matching transactions
      const { data: updated, error: updateError } = await db
        .from('transactions')
        .update({
          category_id: newCategoryId,
          manually_categorized: true,
          categorized_by_user_id: user?.id ?? null,
        })
        .eq('association_id', associationId)
        .eq('description', vendorName)
        .select('id');

      if (updateError) throw updateError;

      const updatedCount = (updated ?? []).length;

      // 2. Optionally create a vendor_rule
      let ruleCreated = false;
      if (createRule && vendorName.trim()) {
        // Escape the vendor name for use as a regex literal
        const escapedPattern = vendorName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const { error: ruleError } = await db.from('vendor_rules').insert([{
          keyword_pattern: escapedPattern,
          category_id: newCategoryId,
          is_global: false,
          association_id: associationId,
          priority: 50,
          created_by: user?.id ?? null,
        }]);

        if (ruleError) throw ruleError;
        ruleCreated = true;
      }

      return { updated: updatedCount, ruleCreated };
    },

    onSuccess: ({ updated, ruleCreated }, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.byAssociation(associationId) });
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.vendorSummary(associationId) });
      if (ruleCreated) {
        queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.vendorRules(associationId) });
        queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.vendorRules(undefined) });
      }
      const ruleMsg = ruleCreated ? ' og regla stofnuð.' : '.';
      toast.success(`${updated} færslur endurflokkað${ruleMsg}`);
    },

    onError: (error: Error) => {
      toast.error(`Villa við endurflokk: ${error.message}`);
    },
  });
}

// ============================================================
// useRunAutoClassify
// Re-runs the categorization engine over uncategorized or all
// transactions for an association, applying DB vendor rules +
// built-in keyword engine. Writes results in chunks of 50.
// ============================================================

export function useRunAutoClassify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      associationId,
      scope,
    }: RunAutoClassifyInput): Promise<{ classified: number; skipped: number }> => {
      // 1. Fetch relevant transactions
      let txQuery = db
        .from('transactions')
        .select('id, description, amount')
        .eq('association_id', associationId);

      if (scope === 'uncategorized') {
        txQuery = txQuery.is('category_id', null);
      }

      const { data: txRows, error: txError } = await txQuery;
      if (txError) throw txError;

      if (!txRows || txRows.length === 0) {
        return { classified: 0, skipped: 0 };
      }

      // 2. Fetch vendor rules + categories
      const [rulesRes, catsRes] = await Promise.all([
        db
          .from('vendor_rules')
          .select('*')
          .or(`is_global.eq.true,association_id.eq.${associationId}`)
          .order('priority', { ascending: false }),
        db.from('categories').select('*'),
      ]);

      if (rulesRes.error) throw rulesRes.error;
      if (catsRes.error)  throw catsRes.error;

      const vendorRules = (rulesRes.data ?? []) as VendorRule[];
      const categories  = (catsRes.data  ?? []) as Category[];

      // Build a name_is → id map for quick lookup
      const catByName = new Map<string, string>();
      for (const cat of categories) {
        catByName.set(cat.name_is, cat.id);
      }

      // 3. Run the engine and collect updates
      type UpdateRow = { id: string; category_id: string; is_income: boolean; is_individual_payment: boolean };
      const updates: UpdateRow[] = [];
      let skipped = 0;

      for (const tx of txRows) {
        const result = categorizeTransaction(
          tx.description as string,
          tx.amount as number,
          vendorRules,
          categories
        );

        if (result.method === 'fallback') {
          skipped++;
          continue;
        }

        const categoryId = catByName.get(result.categoryNameIs);
        if (!categoryId) {
          skipped++;
          continue;
        }

        updates.push({
          id: tx.id as string,
          category_id: categoryId,
          is_income: result.isIncome,
          is_individual_payment: result.isIndividualPayment,
        });
      }

      // 4. Apply updates in chunks of 50 (upsert by id)
      const CHUNK_SIZE = 50;
      for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);

        // Update each row individually to handle partial failures gracefully
        const promises = chunk.map((row) =>
          db
            .from('transactions')
            .update({
              category_id: row.category_id,
              is_income: row.is_income,
              is_individual_payment: row.is_individual_payment,
              manually_categorized: false,
            })
            .eq('id', row.id)
        );

        const results = await Promise.all(promises);
        for (const res of results) {
          if (res.error) throw res.error;
        }
      }

      return { classified: updates.length, skipped };
    },

    onSuccess: ({ classified, skipped }, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.byAssociation(associationId) });
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.vendorSummary(associationId) });
      toast.success(
        `Sjálfvirk flokkun lokið: ${classified} færslur flokkaðar, ${skipped} óþekktar.`
      );
    },

    onError: (error: Error) => {
      toast.error(`Villa við sjálfvirka flokkun: ${error.message}`);
    },
  });
}
