import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { format, startOfYear, endOfYear, subYears } from 'date-fns';

export interface YearCategoryComparison {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  currentYear: number;
  previousYear: number;
  change: number; // absolute
  changePct: number | null; // percentage, null if prev=0
}

export interface YearComparisonData {
  currentYear: number;
  previousYear: number;
  currentIncome: number;
  previousIncome: number;
  currentExpenses: number;
  previousExpenses: number;
  currentNet: number;
  previousNet: number;
  incomeChangePct: number | null;
  expensesChangePct: number | null;
  netChangePct: number | null;
  categoryComparisons: YearCategoryComparison[];
}

export function useYearComparison(
  associationId: string | null | undefined
) {
  return useQuery({
    queryKey: ['year-comparison', associationId],
    queryFn: async (): Promise<YearComparisonData> => {
      const now = new Date();
      const cy = now.getFullYear();
      const py = cy - 1;

      const currentYearStart = format(startOfYear(now), 'yyyy-MM-dd');
      const currentYearEnd = format(endOfYear(now), 'yyyy-MM-dd');
      const previousYearStart = format(
        startOfYear(subYears(now, 1)),
        'yyyy-MM-dd'
      );
      const previousYearEnd = format(
        endOfYear(subYears(now, 1)),
        'yyyy-MM-dd'
      );

      const empty: YearComparisonData = {
        currentYear: cy,
        previousYear: py,
        currentIncome: 0,
        previousIncome: 0,
        currentExpenses: 0,
        previousExpenses: 0,
        currentNet: 0,
        previousNet: 0,
        incomeChangePct: null,
        expensesChangePct: null,
        netChangePct: null,
        categoryComparisons: [],
      };

      if (!associationId) return empty;

      // Fetch both years in parallel
      const [currentRes, previousRes] = await Promise.all([
        db
          .from('transactions')
          .select(
            'amount, is_income, category_id, category:categories(name_is, color)'
          )
          .eq('association_id', associationId)
          .gte('date', currentYearStart)
          .lte('date', currentYearEnd),
        db
          .from('transactions')
          .select(
            'amount, is_income, category_id, category:categories(name_is, color)'
          )
          .eq('association_id', associationId)
          .gte('date', previousYearStart)
          .lte('date', previousYearEnd),
      ]);

      if (currentRes.error) throw currentRes.error;
      if (previousRes.error) throw previousRes.error;

      type TxRow = {
        amount: number;
        is_income: boolean;
        category_id: string | null;
        category: { name_is: string; color: string | null } | null;
      };

      const currentTx = (currentRes.data ?? []) as TxRow[];
      const previousTx = (previousRes.data ?? []) as TxRow[];

      function aggregateTotals(txList: TxRow[]) {
        let income = 0;
        let expenses = 0;
        const catMap = new Map<
          string,
          {
            name: string;
            color: string;
            total: number;
          }
        >();
        for (const tx of txList) {
          if (tx.is_income) {
            income += tx.amount;
          } else {
            expenses += Math.abs(tx.amount);
            if (tx.category_id) {
              const e = catMap.get(tx.category_id) ?? {
                name: tx.category?.name_is ?? 'Óþekkt',
                color: tx.category?.color ?? '#1e3a5f',
                total: 0,
              };
              e.total += Math.abs(tx.amount);
              catMap.set(tx.category_id, e);
            }
          }
        }
        return { income, expenses, catMap };
      }

      const current = aggregateTotals(currentTx);
      const previous = aggregateTotals(previousTx);

      function pctChange(curr: number, prev: number): number | null {
        if (prev === 0) return null;
        return Math.round(((curr - prev) / prev) * 100);
      }

      // Build category comparisons - union of all category IDs
      const allCatIds = new Set([
        ...current.catMap.keys(),
        ...previous.catMap.keys(),
      ]);
      const categoryComparisons: YearCategoryComparison[] = [];
      for (const catId of allCatIds) {
        const curr = current.catMap.get(catId);
        const prev = previous.catMap.get(catId);
        const currVal = curr?.total ?? 0;
        const prevVal = prev?.total ?? 0;
        const name = curr?.name ?? prev?.name ?? 'Óþekkt';
        const color = curr?.color ?? prev?.color ?? '#1e3a5f';
        categoryComparisons.push({
          categoryId: catId,
          categoryName: name,
          categoryColor: color,
          currentYear: currVal,
          previousYear: prevVal,
          change: currVal - prevVal,
          changePct: pctChange(currVal, prevVal),
        });
      }

      // Sort by current year spend desc
      categoryComparisons.sort(
        (a, b) => b.currentYear - a.currentYear
      );

      return {
        currentYear: cy,
        previousYear: py,
        currentIncome: current.income,
        previousIncome: previous.income,
        currentExpenses: current.expenses,
        previousExpenses: previous.expenses,
        currentNet: current.income - current.expenses,
        previousNet: previous.income - previous.expenses,
        incomeChangePct: pctChange(current.income, previous.income),
        expensesChangePct: pctChange(current.expenses, previous.expenses),
        netChangePct: pctChange(
          current.income - current.expenses,
          previous.income - previous.expenses
        ),
        categoryComparisons,
      };
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
