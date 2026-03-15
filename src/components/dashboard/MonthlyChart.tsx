import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MonthlyData } from '@/types/database';

interface MonthlyChartProps {
  data: MonthlyData[];
  isLoading: boolean;
  /** Optional: render inside an existing card (no wrapping Card) */
  bare?: boolean;
  /** Optional: extra content below the chart */
  children?: React.ReactNode;
}

function ChartContent({ data, isLoading, children }: { data: MonthlyData[]; isLoading: boolean; children?: React.ReactNode }) {
  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
        Engin gögn til að sýna
      </div>
    );
  }
  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month_label" tick={{ fontSize: 11 }} className="text-zinc-500" />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}þ`} />
          <Tooltip
            formatter={(value: number) => value.toLocaleString('is-IS') + ' kr.'}
            labelFormatter={(label) => label}
          />
          <Legend />
          <Bar dataKey="income" name="Tekjur" fill="#0d9488" radius={[2, 2, 0, 0]} />
          <Bar dataKey="expenses" name="Gjöld" fill="#e11d48" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {children}
    </>
  );
}

export function MonthlyChart({ data, isLoading, bare, children }: MonthlyChartProps) {
  if (bare) {
    return <ChartContent data={data} isLoading={isLoading}>{children}</ChartContent>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mánaðarleg þróun</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContent data={data} isLoading={isLoading}>{children}</ChartContent>
      </CardContent>
    </Card>
  );
}
