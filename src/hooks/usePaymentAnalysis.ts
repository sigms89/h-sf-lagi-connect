import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { format, subMonths } from 'date-fns';
import { is } from 'date-fns/locale';

interface MonthlyPaymentData {
  month: string;
  month_label: string;
  individual: number;
  other: number;
}

export interface PaymentAnalysisData {
  individualTotal: number;
  individualCount: number;
  otherIncomeTotal: number;
  otherIncomeCount: number;
  totalIncome: number;
  monthlyData: MonthlyPaymentData[];
}

export function usePaymentAnalysis(associationId: string | null | undefined) {
  return useQuery({
    queryKey: ['payment-analysis', associationId],
    queryFn: async (): Promise<PaymentAnalysisData | null> => {
      if (!associationId) return null;

      const twelveMonthsAgo = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

      const { data, error } = await db
        .from('transactions')
        .select('date, amount, is_income, is_individual_payment')
        .eq('association_id', associationId)
        .eq('is_income', true)
        .gte('date', twelveMonthsAgo)
        .order('date', { ascending: true });

      if (error) throw error;

      const txList = (data ?? []) as Array<{
        date: string;
        amount: number;
        is_income: boolean;
        is_individual_payment: boolean | null;
      }>;

      let individualTotal = 0;
      let individualCount = 0;
      let otherIncomeTotal = 0;
      let otherIncomeCount = 0;

      // Build monthly buckets
      const monthlyMap = new Map<string, { individual: number; other: number }>();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        monthlyMap.set(format(d, 'yyyy-MM'), { individual: 0, other: 0 });
      }

      for (const tx of txList) {
        const amt = Math.abs(tx.amount);
        const monthKey = tx.date.slice(0, 7);
        const entry = monthlyMap.get(monthKey);

        if (tx.is_individual_payment) {
          individualTotal += amt;
          individualCount++;
          if (entry) entry.individual += amt;
        } else {
          otherIncomeTotal += amt;
          otherIncomeCount++;
          if (entry) entry.other += amt;
        }
      }

      const monthlyData: MonthlyPaymentData[] = Array.from(monthlyMap.entries()).map(
        ([month, vals]) => ({
          month,
          month_label: format(new Date(month + '-01'), 'MMM yy', { locale: is }),
          individual: vals.individual,
          other: vals.other,
        })
      );

      return {
        individualTotal,
        individualCount,
        otherIncomeTotal,
        otherIncomeCount,
        totalIncome: individualTotal + otherIncomeTotal,
        monthlyData,
      };
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
