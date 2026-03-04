import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  BarChart3,
  Store,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useTransactionStats } from '@/hooks/useTransactions';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { PaymentAnalysis } from '@/components/analytics/PaymentAnalysis';
import { YearComparison } from '@/components/analytics/YearComparison';

function formatISK(amount: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

const COLORS = [
  '#1e3a5f',
  '#0d9488',
  '#f59e0b',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
];

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number | null;
  description?: string;
  colorClass?: string;
}

function KpiCard({
  title,
  value,
  icon,
  trend,
  description,
  colorClass = 'text-[#1e3a5f]',
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className={`text-xl font-bold ${colorClass} truncate`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="text-muted-foreground/50 shrink-0 ml-2">{icon}</div>
        </div>
        {trend !== null && trend !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={`text-xs ${
                trend > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend > 0 ? '+' : ''}
              {trend}% frá síðasta mánuði
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;

  const { data: stats, isLoading } = useTransactionStats(associationId);

  const categoryBreakdown = stats?.category_breakdown ?? [];
  const monthlyData = stats?.monthly_data ?? [];

  // Sort categories by total spend desc for table
  const topCategories = [...categoryBreakdown]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (
    <div className="space-y-8 p-6">
      {/* Page heading */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Greining</h1>
          <p className="text-sm text-muted-foreground">
            Ítarleg greining á fjárhag húsfélagsins
          </p>
        </div>
        <Link to="/analytics/vendors">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#1e3a5f]/30 text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
          >
            <Store className="h-4 w-4" />
            Sjá birgja
          </Button>
        </Link>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
                <div className="h-7 bg-muted rounded w-32 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Heildartekjur"
            value={formatISK(stats?.total_income ?? 0)}
            icon={<DollarSign className="h-5 w-5" />}
            colorClass="text-emerald-600"
            description="Allar tekjur á tímabili"
          />
          <KpiCard
            title="Heildarútgjöld"
            value={formatISK(stats?.total_expenses ?? 0)}
            icon={<BarChart3 className="h-5 w-5" />}
            colorClass="text-red-600"
            description="Allt rekstrarkostnaður"
          />
          <KpiCard
            title="Nettó staða"
            value={
              (stats?.net_balance ?? 0) >= 0
                ? formatISK(stats?.net_balance ?? 0)
                : '-' + formatISK(stats?.net_balance ?? 0)
            }
            icon={<ArrowUpRight className="h-5 w-5" />}
            colorClass={
              (stats?.net_balance ?? 0) >= 0
                ? 'text-emerald-600'
                : 'text-red-600'
            }
            description="Tekjur mínus útgjöld"
          />
          <KpiCard
            title="Núverandi staða"
            value={
              stats?.current_balance !== null &&
              stats?.current_balance !== undefined
                ? (stats.current_balance >= 0
                    ? formatISK(stats.current_balance)
                    : '-' + formatISK(stats.current_balance))
                : '—'
            }
            icon={<DollarSign className="h-5 w-5" />}
            colorClass="text-[#1e3a5f]"
            description="Yfirstandandi reikningsstaða"
          />
        </div>
      )}

      {/* Monthly chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Mánaðarleg þróun
          </CardTitle>
          <CardDescription className="text-xs">
            Tekjur og gjöld eftir mánuðum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={monthlyData} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Category breakdown: pie + top table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Útgjöld eftir flokki
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Engin gögn
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.category_id}
                        fill={
                          entry.category_color ||
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => [
                      formatISK(value),
                      'Útgjöld',
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top categories table */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Stærstu kostnaðarflokkar
            </CardTitle>
            <CardDescription className="text-xs">
              Smelltu á flokk til að sjá nákvæmar færslur
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">
                Engin gögn fundust.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flokkur</TableHead>
                    <TableHead className="text-right">Upphæð</TableHead>
                    <TableHead className="text-right">Hlutfall</TableHead>
                    <TableHead className="text-right">Færslur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCategories.map((cat, index) => (
                    <TableRow key={cat.category_id} className="group">
                      <TableCell>
                        <Link
                          to={`/analytics/category/${cat.category_id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                cat.category_color ||
                                COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-sm font-medium text-[#1e3a5f] group-hover:text-[#0d9488] transition-colors">
                            {cat.category_name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {formatISK(cat.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(cat.percentage, 100)}%`,
                                backgroundColor:
                                  cat.category_color ||
                                  COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {cat.transaction_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Payment Analysis section */}
      <PaymentAnalysis />

      <Separator />

      {/* Year Comparison section */}
      <YearComparison />
    </div>
  );
}
