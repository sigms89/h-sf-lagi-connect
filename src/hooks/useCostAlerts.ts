import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { format, subMonths } from 'date-fns';

export interface CostAlert {
  categoryId: string;
  categoryName: string;
  percentChange: number; // positive = increase
  recentAvg: number;
  previousAvg: number;
}

export function useCostAlerts(associationId: string | null | undefined) {
  return useQuery({
    queryKey: ['cost-alerts', associationId],
    queryFn: async (): Promise<CostAlert[]> => {
      if (!associationId) return [];

      const now = new Date();
      const threeMonthsAgo = format(subMonths(now, 3), 'yyyy-MM-dd');
      const sixMonthsAgo = format(subMonths(now, 6), 'yyyy-MM-dd');

      // Fetch last 6 months of expense transactions with categories
      const { data, error } = await db
        .from('transactions')
        .select('date, amount, category_id, category:categories(name_is)')
        .eq('association_id', associationId)
        .eq('is_income', false)
        .lt('amount', 0)
        .gte('date', sixMonthsAgo)
        .limit(10000);

      if (error) throw error;

      const txList = (data ?? []) as Array<{
        date: string;
        amount: number;
        category_id: string | null;
        category: { name_is: string } | null;
      }>;

      // Group by category, split into recent 3mo and previous 3mo
      const categoryTotals = new Map<
        string,
        { name: string; recent: number; previous: number }
      >();

      for (const tx of txList) {
        if (!tx.category_id) continue;
        const entry = categoryTotals.get(tx.category_id) ?? {
          name: tx.category?.name_is ?? 'Óþekkt',
          recent: 0,
          previous: 0,
        };
        if (tx.date >= threeMonthsAgo) {
          entry.recent += Math.abs(tx.amount);
        } else {
          entry.previous += Math.abs(tx.amount);
        }
        categoryTotals.set(tx.category_id, entry);
      }

      // Compute alerts for categories with >15% increase
      const alerts: CostAlert[] = [];
      for (const [catId, catData] of categoryTotals) {
        const recentAvg = catData.recent / 3;
        const previousAvg = catData.previous / 3;
        if (previousAvg <= 0) continue;
        const pctChange = ((recentAvg - previousAvg) / previousAvg) * 100;
        if (pctChange > 15) {
          alerts.push({
            categoryId: catId,
            categoryName: catData.name,
            percentChange: Math.round(pctChange),
            recentAvg,
            previousAvg,
          });
        }
      }

      return alerts.sort((a, b) => b.percentChange - a.percentChange);
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
