// ============================================================
// Húsfélagið.is — Analytics Page (Full Implementation)
// Shows real charts + summary KPIs instead of placeholder
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useTransactionStats } from '@/hooks/useTransactions';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';

function formatISK(value: number): string {
  return value.toLocaleString('is-IS', { maximumFractionDigits: 0 }) + ' kr.';
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-xl font-bold tracking-tight">{value}</p>
              {trendLabel && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  <span>{trendLabel}</span>
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: association } = useCurrentAssociation();
  const { data: stats, isLoading } = useTransactionStats(association?.id);

  const netIsPositive = (stats?.net_balance ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Greining</h1>
        <Badge variant="secondary">Beta</Badge>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tekjur (12 mán.)"
          value={formatISK(stats?.total_income ?? 0)}
          icon={TrendingUp}
          trend="up"
          trendLabel="Síðustu 12 mánuðir"
          isLoading={isLoading}
        />
        <StatCard
          title="Gjöld (12 mán.)"
          value={formatISK(stats?.total_expenses ?? 0)}
          icon={TrendingDown}
          trend="down"
          trendLabel="Síðustu 12 mánuðir"
          isLoading={isLoading}
        />
        <StatCard
          title="Nettó"
          value={formatISK(stats?.net_balance ?? 0)}
          icon={Wallet}
          trend={netIsPositive ? 'up' : 'down'}
          trendLabel={netIsPositive ? 'Jákvætt' : 'Neikvætt'}
          isLoading={isLoading}
        />
        <StatCard
          title="Óflokkað"
          value={`${stats?.uncategorized_count ?? 0} færslur`}
          icon={AlertTriangle}
          trend={
            (stats?.uncategorized_count ?? 0) > 0 ? 'down' : 'neutral'
          }
          trendLabel={
            (stats?.uncategorized_count ?? 0) > 0
              ? 'Þarfnast flokkunar'
              : 'Allt flokkað'
          }
          isLoading={isLoading}
        />
      </div>

      {/* Charts — 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={stats?.monthly_data ?? []} isLoading={isLoading} />
        <CategoryPieChart data={stats?.category_breakdown ?? []} isLoading={isLoading} />
      </div>

      {/* Top expense categories table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stærstu kostnaðarflokkar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (stats?.category_breakdown ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Engar færslur enn — hlaðið upp gögnum til að sjá greiningu
            </div>
          ) : (
            <div className="space-y-2">
              {(stats?.category_breakdown ?? []).slice(0, 8).map((cat, i) => (
                <div
                  key={cat.category_id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium truncate">
                      {cat.category_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm tabular-nums text-right w-28">
                      {formatISK(cat.total)}
                    </span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
