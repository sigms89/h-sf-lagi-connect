// ============================================================
// Húsfélagið.is — BenchmarkTrendChart
// Inline trend chart for expanded table rows
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths } from 'date-fns';

interface BenchmarkTrendChartProps {
  associationId: string;
  categoryId: string;
  numUnits: number | undefined;
}

interface MonthEntry {
  month: string;
  label: string;
  total: number;
}

export function BenchmarkTrendChart({
  associationId,
  categoryId,
  numUnits,
}: BenchmarkTrendChartProps) {
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['benchmark-trend', associationId, categoryId],
    queryFn: async (): Promise<MonthEntry[]> => {
      const twelveMonthsAgo = format(subMonths(new Date(), 11), 'yyyy-MM-01');

      const { data, error } = await db
        .from('transactions')
        .select('date, amount')
        .eq('association_id', associationId)
        .eq('category_id', categoryId)
        .eq('is_income', false)
        .lt('amount', 0)
        .gte('date', twelveMonthsAgo);

      if (error) throw error;

      // Build monthly map
      const map = new Map<string, MonthEntry>();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, 'yyyy-MM');
        map.set(key, { month: key, label: format(d, 'MMM'), total: 0 });
      }

      for (const tx of data ?? []) {
        const key = (tx.date as string).slice(0, 7);
        const entry = map.get(key);
        if (entry) {
          entry.total += Math.abs(tx.amount as number);
        }
      }

      return Array.from(map.values());
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!monthlyData || monthlyData.every((m) => m.total === 0)) {
    return (
      <p className="text-xs text-muted-foreground">Engin gögn til að sýna þróun.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={monthlyData}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
          formatter={(value: number) =>
            [`${value.toLocaleString('is-IS')} kr.`, 'Kostnaður']
          }
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#1e3a5f"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
