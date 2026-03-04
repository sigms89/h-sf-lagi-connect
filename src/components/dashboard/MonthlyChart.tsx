import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MonthlyData } from '@/types/database';

interface MonthlyChartProps {
  data: MonthlyData[];
  isLoading: boolean;
}

export function MonthlyChart({ data, isLoading }: MonthlyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mánaðarleg þróun</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Engin gögn til að sýna
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month_label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}þ`} />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('is-IS') + ' kr.'}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Bar dataKey="income" name="Tekjur" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" name="Gjöld" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
