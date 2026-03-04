import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { Transaction, TransactionInsert, TransactionFilters, TransactionStats, MonthlyData, CategoryBreakdown } from '@/types/database';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  byAssociation: (assocId: string) => [...TRANSACTION_KEYS.all, assocId] as const,
  list: (assocId: string, filters?: TransactionFilters) => [...TRANSACTION_KEYS.byAssociation(assocId), 'list', filters] as const,
  stats: (assocId: string) => [...TRANSACTION_KEYS.byAssociation(assocId), 'stats'] as const,
};

export function useTransactions(associationId: string | null | undefined, filters: TransactionFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: TRANSACTION_KEYS.list(associationId ?? '', filters),
    queryFn: async (): Promise<{ data: Transaction[]; count: number }> => {
      if (!associationId) return { data: [], count: 0 };

      let query = db
        .from('transactions')
        .select(`*, category:categories(*), vendor:vendors(*)`, { count: 'exact' })
        .eq('association_id', associationId)
        .order('date', { ascending: false })
        .range(from, to);

      if (filters.search) query = query.ilike('description', `%${filters.search}%`);
      if (filters.category_id) query = query.eq('category_id', filters.category_id);
      if (filters.is_uncategorized) query = query.is('category_id', null);
      if (filters.date_from) query = query.gte('date', filters.date_from);
      if (filters.date_to) query = query.lte('date', filters.date_to);
      if (filters.is_income !== undefined) query = query.eq('is_income', filters.is_income);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Transaction[], count: count ?? 0 };
    },
    enabled: !!associationId,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ associationId, transactions, uploadedBy, fileName, fileType }: {
      associationId: string;
      transactions: TransactionInsert[];
      uploadedBy: string;
      fileName?: string;
      fileType?: 'csv' | 'xlsx' | 'paste' | 'json';
    }): Promise<{ uploaded: number; batchId: string }> => {
      const { data: batch, error: batchError } = await db
        .from('upload_batches')
        .insert([{ association_id: associationId, uploaded_by: uploadedBy, file_name: fileName ?? null, file_type: fileType ?? 'paste', row_count: transactions.length }])
        .select()
        .single();

      if (batchError) throw batchError;

      const CHUNK_SIZE = 100;
      let totalUploaded = 0;

      for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
        const chunk = transactions.slice(i, i + CHUNK_SIZE).map((t) => ({ ...t, association_id: associationId, uploaded_batch_id: batch.id }));
        const { error: txError } = await db.from('transactions').insert(chunk);
        if (txError) throw txError;
        totalUploaded += chunk.length;
      }

      return { uploaded: totalUploaded, batchId: batch.id };
    },
    onSuccess: ({ uploaded }, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.byAssociation(associationId) });
      toast.success(`${uploaded} færslur hlaðnar upp`);
    },
    onError: (error: Error) => {
      toast.error(`Villa við upphleðslu: ${error.message}`);
    },
  });
}

export function useUpdateTransactionCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, categoryId, userId, associationId }: {
      transactionId: string;
      categoryId: string | null;
      userId: string;
      associationId: string;
    }): Promise<void> => {
      const { error } = await db
        .from('transactions')
        .update({ category_id: categoryId, manually_categorized: true, categorized_by_user_id: userId })
        .eq('id', transactionId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.byAssociation(associationId) });
    },
    onError: (error: Error) => {
      toast.error(`Villa við flokkun: ${error.message}`);
    },
  });
}

export function useTransactionStats(associationId: string | null | undefined) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.stats(associationId ?? ''),
    queryFn: async (): Promise<TransactionStats> => {
      if (!associationId) {
        return { total_income: 0, total_expenses: 0, net_balance: 0, uncategorized_count: 0, monthly_data: [], category_breakdown: [], current_balance: null };
      }

      const twelveMonthsAgo = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

      const { data: transactions, error } = await db
        .from('transactions')
        .select(`id, date, amount, is_income, category_id, category:categories(id, name_is, color)`)
        .eq('association_id', associationId)
        .gte('date', twelveMonthsAgo)
        .order('date', { ascending: false });

      if (error) throw error;

      const txList = (transactions ?? []) as Array<{
        id: string; date: string; amount: number; is_income: boolean;
        category_id: string | null; category: { id: string; name_is: string; color: string } | null;
      }>;

      let totalIncome = 0, totalExpenses = 0, uncategorizedCount = 0;

      for (const tx of txList) {
        if (tx.is_income || tx.amount > 0) totalIncome += Math.abs(tx.amount);
        else totalExpenses += Math.abs(tx.amount);
        if (!tx.category_id) uncategorizedCount++;
      }

      const monthlyMap = new Map<string, MonthlyData>();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, 'yyyy-MM');
        monthlyMap.set(key, { month: key, month_label: format(d, 'MMM yyyy'), income: 0, expenses: 0, net: 0 });
      }

      for (const tx of txList) {
        const key = tx.date.slice(0, 7);
        const entry = monthlyMap.get(key);
        if (entry) {
          if (tx.is_income || tx.amount > 0) entry.income += Math.abs(tx.amount);
          else entry.expenses += Math.abs(tx.amount);
          entry.net = entry.income - entry.expenses;
        }
      }

      const categoryMap = new Map<string, { name: string; color: string; total: number; count: number }>();
      for (const tx of txList) {
        if (tx.is_income || tx.amount >= 0) continue;
        const catId = tx.category_id ?? 'uncategorized';
        const catName = tx.category?.name_is ?? 'Óflokkað';
        const catColor = tx.category?.color ?? 'yellow';
        const current = categoryMap.get(catId) ?? { name: catName, color: catColor, total: 0, count: 0 };
        current.total += Math.abs(tx.amount);
        current.count += 1;
        categoryMap.set(catId, current);
      }

      const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([id, val]) => ({
          category_id: id, category_name: val.name, category_color: val.color,
          total: val.total, percentage: totalExpenses > 0 ? (val.total / totalExpenses) * 100 : 0,
          transaction_count: val.count,
        }))
        .sort((a, b) => b.total - a.total);

      const { data: latestTx } = await db
        .from('transactions')
        .select('balance')
        .eq('association_id', associationId)
        .not('balance', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        total_income: totalIncome, total_expenses: totalExpenses,
        net_balance: totalIncome - totalExpenses, uncategorized_count: uncategorizedCount,
        monthly_data: Array.from(monthlyMap.values()), category_breakdown: categoryBreakdown,
        current_balance: latestTx?.balance ?? null,
      };
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
