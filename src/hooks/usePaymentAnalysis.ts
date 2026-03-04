import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { format, subMonths } from 'date-fns';
import { is } from 'date-fns/locale';

export interface PaymentMonthlyData {
  month: string;
  month_label: string;
  individual: number;
  other: number;
}

export interface PaymentAnalysisData {
  individualCount: number;
  individualTotal: number;
  otherIncomeCount: number;
  otherIncomeTotal: number;
  totalIncome: number;
  monthlyData: PaymentMonthlyData[];
}

export function usePaymentAnalysis(
  associationId: string | null | undefined
) {
  return useQuery({
    queryKey: ['payment-analysis', associationId],
    queryFn: async (): Promise<PaymentAnalysisData> => {
      if (!associationId) {
        return {
          individualCount: 0,
          individualTotal: 0,
          otherIncomeCount: 0,
          otherIncomeTotal: 0,
          totalIncome: 0,
          monthlyData: [],
        };
      }

      const twelveMonthsAgo = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

      const { data, error } = await db
        .from('transactions')
        .select('date, amount, is_individual_payment, is_income')
        .eq('association_id', associationId)
        .eq('is_income', true)
        .gte('date', twelveMonthsAgo)
        .order('date', { ascending: false });

      if (error) throw error;

      const txList = (data ?? []) as Array<{
        date: string;
        amount: number;
        is_individual_payment: boolean | null;
        is_income: boolean;
      }>;

      // Aggregate totals
      let individualCount = 0;
      let individualTotal = 0;
      let otherIncomeCount = 0;
      let otherIncomeTotal = 0;

      // Build monthly map
      const monthlyMap = new Map<
        string,
        { individual: number; other: number }
      >();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        monthlyMap.set(format(d, 'yyyy-MM'), { individual: 0, other: 0 });
      }

      for (const tx of txList) {
        const amt = Math.abs(tx.amount);
        if (tx.is_individual_payment) {
          individualCount += 1;
          individualTotal += amt;
        } else {
          otherIncomeCount += 1;
          otherIncomeTotal += amt;
        }

        const monthKey = tx.date.slice(0, 7);
        const entry = monthlyMap.get(monthKey);
        if (entry) {
          if (tx.is_individual_payment) {
            entry.individual += amt;
          } else {
            entry.other += amt;
          }
        }
      }

      const monthlyData: PaymentMonthlyData[] = Array.from(
        monthlyMap.entries()
      ).map(([month, v]) => ({
        month,
        month_label: format(new Date(month + '-01'), 'MMM yy', { locale: is }),
        individual: v.individual,
        other: v.other,
      }));

      return {
        individualCount,
        individualTotal,
        otherIncomeCount,
        otherIncomeTotal,
        totalIncome: individualTotal + otherIncomeTotal,
        monthlyData,
      };
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
