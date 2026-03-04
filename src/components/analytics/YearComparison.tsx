import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useYearComparison } from '@/hooks/useYearComparison';

function formatISK(amount: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat('is-IS', {
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ChangeBadgeProps {
  pct: number | null;
  inverse?: boolean; // if true, increase = bad (expenses)
}

function ChangeBadge({ pct, inverse = false }: ChangeBadgeProps) {
  if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;
  const isPositive = pct > 0;
  const isBad = inverse ? isPositive : !isPositive;

  const colorClass =
    pct === 0
      ? 'bg-gray-100 text-gray-700'
      : isBad
      ? 'bg-red-100 text-red-800'
      : 'bg-emerald-100 text-emerald-800';

  const Icon = pct === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <Badge variant="secondary" className={`${colorClass} text-xs gap-1`}>
      <Icon className="h-3 w-3" />
      {pct > 0 ? '+' : ''}
      {pct}%
    </Badge>
  );
}

export function YearComparison() {
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;
  const { data, isLoading } = useYearComparison(associationId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Top 8 categories for chart (by current year spend)
  const topCats = data.categoryComparisons.slice(0, 8);
  const chartData = topCats.map((c) => ({
    name:
      c.categoryName.length > 14
        ? c.categoryName.slice(0, 13) + '…'
        : c.categoryName,
    [data.currentYear]: c.currentYear,
    [data.previousYear]: c.previousYear,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Árssamanburður</h2>
        <p className="text-sm text-muted-foreground">
          {data.currentYear} samanborið við {data.previousYear}
        </p>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-2">Heildartekjur</p>
            <div className="flex items-end gap-2 flex-wrap">
              <p className="text-xl font-bold">
                {formatISK(data.currentIncome)}
              </p>
              <ChangeBadge pct={data.incomeChangePct} inverse={false} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.previousYear}: {formatISK(data.previousIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-2">
              Heildarútgjöld
            </p>
            <div className="flex items-end gap-2 flex-wrap">
              <p className="text-xl font-bold">
                {formatISK(data.currentExpenses)}
              </p>
              <ChangeBadge pct={data.expensesChangePct} inverse={true} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.previousYear}: {formatISK(data.previousExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-2">Nettó staða</p>
            <div className="flex items-end gap-2 flex-wrap">
              <p
                className={`text-xl font-bold ${
                  data.currentNet >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {data.currentNet >= 0
                  ? formatISK(data.currentNet)
                  : '-' + formatISK(data.currentNet)}
              </p>
              <ChangeBadge pct={data.netChangePct} inverse={false} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.previousYear}:{' '}
              {data.previousNet >= 0
                ? formatISK(data.previousNet)
                : '-' + formatISK(data.previousNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-category bar chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Útgjöld eftir flokki – {data.previousYear} vs. {data.currentYear}
            </CardTitle>
            <CardDescription className="text-xs">
              Stærstu 8 kostnaðarflokkar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number, name: string | number) => [
                    formatISK(value),
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey={data.previousYear}
                  fill="#cbd5e1"
                  radius={[0, 3, 3, 0]}
                  maxBarSize={14}
                />
                <Bar
                  dataKey={data.currentYear}
                  fill="#1e3a5f"
                  radius={[0, 3, 3, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-category comparison table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Samanburður eftir flokki
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flokkur</TableHead>
                <TableHead className="text-right">
                  {data.previousYear}
                </TableHead>
                <TableHead className="text-right">
                  {data.currentYear}
                </TableHead>
                <TableHead className="text-right">Breyting</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categoryComparisons.map((cat) => (
                <TableRow key={cat.categoryId}>
                  <TableCell className="flex items-center gap-2 py-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.categoryColor }}
                    />
                    <span className="text-sm">{cat.categoryName}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatISK(cat.previousYear)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatISK(cat.currentYear)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span
                      className={
                        cat.change > 0
                          ? 'text-red-600'
                          : cat.change < 0
                          ? 'text-emerald-600'
                          : 'text-muted-foreground'
                      }
                    >
                      {cat.change > 0 ? '+' : ''}
                      {formatISK(cat.change)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ChangeBadge pct={cat.changePct} inverse={true} />
                  </TableCell>
                </TableRow>
              ))}
              {data.categoryComparisons.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground py-4"
                  >
                    Engar gögn fundust
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
