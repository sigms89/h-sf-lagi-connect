import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '@/types/database';
import { getCategoryHex } from '@/lib/categories';

// Fallback colors if category_color is missing
const FALLBACK_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
  isLoading: boolean;
}

export function CategoryPieChart({ data, isLoading }: CategoryPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.category_name,
    value: d.total,
    color: getCategoryHex(d.category_color),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kostnaður eftir flokkum</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Engin gögn
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => Math.abs(Math.round(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' kr.'} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
