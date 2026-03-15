// ============================================================
// Húsfélagið.is — Dashboard v3
// Financial advisor style: hero card, action items, trend, bottom row
// ============================================================

import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useTransactionStats } from '@/hooks/useTransactions';
import { useTransactions } from '@/hooks/useTransactions';
import { useTimeRange } from '@/hooks/useTimeRange';
import { useHealthScore } from '@/hooks/useHealthScore';
import { useFinancialAlerts } from '@/hooks/useAlerts';
import { HealthScoreCard } from '@/components/shared/HealthScoreCard';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TimeRangeSelector } from '@/components/shared/TimeRangeSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Upload,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatIskAmount } from '@/lib/categories';

// ── Action Item type ──────────────────────────────────────────
interface ActionItem {
  icon: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  onClick: () => void;
}

const iconMap = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  critical: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: association, isLoading: assocLoading } = useCurrentAssociation();
  const { range, label } = useTimeRange();
  const { data: stats, isLoading: statsLoading } = useTransactionStats(association?.id, range.from);
  const { data: txData, isLoading: txLoading } = useTransactions(association?.id, {
    page: 1,
    page_size: 5,
  });
  const { data: healthData, isLoading: healthLoading } = useHealthScore(association?.id);
  const { data: alerts = [] } = useFinancialAlerts(association?.id);

  const isLoading = assocLoading || statsLoading;
  const hasData = (stats?.total_income ?? 0) > 0 || (stats?.total_expenses ?? 0) > 0;

  // ── Computed values ────────────────────────────────────────
  const score = healthData?.score ?? 0;
  const avgMonthlyExpense = (stats?.total_expenses ?? 0) / 12;
  const currentBalance = stats?.current_balance ?? 0;
  const balanceMonths = avgMonthlyExpense > 0 ? (currentBalance / avgMonthlyExpense).toFixed(1) : '—';
  const isBalanceLow = currentBalance < avgMonthlyExpense && avgMonthlyExpense > 0;
  const netBalance = stats?.net_balance ?? 0;
  const uncategorizedCount = stats?.uncategorized_count ?? 0;

  // ── Build summary text ─────────────────────────────────────
  let summaryText = `Sjóðsstaða er ${formatIskAmount(currentBalance)}. `;
  if (isBalanceLow) {
    summaryText += `Þetta er undir meðalmánaðarútgjöldum (${formatIskAmount(Math.round(avgMonthlyExpense))}) sem þýðir að sjóðurinn þolir ekki stóran reikning. `;
  } else if (avgMonthlyExpense > 0) {
    summaryText += `Þetta samsvarar ${balanceMonths} mánaða útgjöldum sem gefur ásættanlegan stuðpúða. `;
  }
  summaryText += `Tekjur síðustu 12 mánaða voru ${formatIskAmount(stats?.total_income ?? 0)} og gjöld ${formatIskAmount(stats?.total_expenses ?? 0)}.`;
  if (netBalance < 0) {
    summaryText += ` Gjöld eru ${formatIskAmount(Math.abs(netBalance))} umfram tekjur á tímabilinu.`;
  }
  if (uncategorizedCount > 0) {
    summaryText += ` Athugið: ${uncategorizedCount} færslur eru óflokkuð.`;
  }

  // ── Status headline ────────────────────────────────────────
  const statusHeadline = score >= 75
    ? 'Staðan er góð'
    : score >= 50
      ? 'Nokkur atriði þarfnast athygli'
      : 'Viðbrögð þarf';

  // ── Hero border color ──────────────────────────────────────
  const heroBorderColor = score >= 75
    ? 'border-l-emerald-400'
    : score >= 50
      ? 'border-l-amber-400'
      : 'border-l-rose-400';

  // ── Build action items ─────────────────────────────────────
  const actionItems: ActionItem[] = [];

  if (isBalanceLow && avgMonthlyExpense > 0) {
    actionItems.push({
      icon: 'warning',
      title: 'Sjóðsstaða undir meðalgjöldum',
      description: `Sjóður (${formatIskAmount(currentBalance)}) dugar ekki fyrir meðalmánuð`,
      onClick: () => navigate('/financials?tab=greining'),
    });
  }

  for (const alert of alerts.slice(0, 5)) {
    const iconType = alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info';
    actionItems.push({
      icon: iconType,
      title: alert.title,
      description: alert.description,
      onClick: () => navigate(alert.actionHref ?? '/financials?tab=greining'),
    });
  }

  if (uncategorizedCount > 0) {
    actionItems.push({
      icon: 'info',
      title: `${uncategorizedCount} óflokkuð færslur`,
      description: 'Smelltu til að flokka',
      onClick: () => navigate('/financials?tab=flokkun'),
    });
  }

  // ── Chart insight ──────────────────────────────────────────
  const monthlyData = stats?.monthly_data ?? [];
  const latestMonth = monthlyData[monthlyData.length - 1];
  const avgExpenseChart = monthlyData.length > 0
    ? monthlyData.reduce((s, m) => s + (m.expenses ?? 0), 0) / monthlyData.length
    : 0;
  const isSpike = latestMonth && avgExpenseChart > 0 && (latestMonth.expenses ?? 0) > avgExpenseChart * 1.25;
  const pctAbove = isSpike ? (((latestMonth.expenses ?? 0) / avgExpenseChart - 1) * 100).toFixed(0) : '';

  // ── Category breakdown (top 5) ─────────────────────────────
  const categories = (stats?.category_breakdown ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ── Page header ───────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Yfirlit</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {association?.name ?? 'Húsfélagið þitt'} — {label}
        </p>
      </div>

      {/* ── Empty state ───────────────────────────────────── */}
      {!isLoading && !hasData && (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
          <Upload className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-900">Engin gögn ennþá</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Hladdu upp bankafærslum til að sjá yfirlit yfir rekstrarkostnað húsfélagsins.
          </p>
          <Button onClick={() => navigate('/upload')} size="sm" className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            Hlaða upp færslum
          </Button>
        </div>
      )}

      {(isLoading || hasData) && (
        <>
          {/* ═══ SECTION 1: HERO CARD ═══════════════════════ */}
          <Card className={`border-l-4 ${heroBorderColor} bg-gradient-to-r from-white to-zinc-50`}>
            <CardContent className="p-6">
              {isLoading || healthLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-8 w-64" />
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left — Summary */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-zinc-900">{statusHeadline}</h2>
                      {actionItems.length === 0 && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          ✓ Ekkert útistandandi
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">{summaryText}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-xs font-medium tabular-nums text-teal-700">
                        <TrendingUp className="h-3 w-3" /> Tekjur {formatIskAmount(stats?.total_income ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-xs font-medium tabular-nums text-rose-700">
                        <TrendingDown className="h-3 w-3" /> Gjöld {formatIskAmount(stats?.total_expenses ?? 0)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-xs font-medium tabular-nums ${netBalance >= 0 ? 'text-zinc-700' : 'text-rose-700'}`}>
                        Nettó {formatIskAmount(netBalance)}
                      </span>
                    </div>
                  </div>
                  {/* Right — Health Score Ring */}
                  {association?.id && (
                    <div className="w-full lg:w-80 flex-shrink-0 flex items-center justify-center">
                      <HealthScoreCard associationId={association.id} variant="full" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ═══ SECTION 2: ACTION ITEMS ════════════════════ */}
          {actionItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900">Þetta þarfnast athygli</h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white px-1.5">
                  {actionItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {actionItems.slice(0, 6).map((item, i) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-4 rounded-xl bg-white hover:bg-zinc-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] transition-all duration-150 cursor-pointer"
                      onClick={item.onClick}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColorMap[item.icon]}`} />
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ SECTION 3: TREND CHART ═════════════════════ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Mánaðarleg þróun</CardTitle>
                <TimeRangeSelector />
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={monthlyData} isLoading={isLoading} bare>
                {isSpike && latestMonth && (
                  <p className="text-xs text-zinc-500 mt-3 px-1">
                    ↑ Gjöld í {latestMonth.month_label} voru {pctAbove}% yfir meðaltali síðustu 12 mánaða
                  </p>
                )}
              </MonthlyChart>
            </CardContent>
          </Card>

          {/* ═══ SECTION 4: BOTTOM ROW ══════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Recent transactions */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Nýlegar færslur</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactions transactions={txData?.data ?? []} isLoading={txLoading} />
                <button
                  onClick={() => navigate('/financials')}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-4 inline-flex items-center gap-1 transition-colors"
                >
                  Sjá allar færslur <ArrowRight className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>

            {/* Top expense categories */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-zinc-900">Stærstu gjaldaliðir</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-6 w-full rounded-lg" />)}
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Engar flokkaðar færslur</p>
                ) : (
                  <div>
                    {categories.map((cat, i) => (
                      <div key={cat.category_id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-zinc-400 w-4 text-right tabular-nums">{i + 1}.</span>
                          <span className="text-sm text-zinc-700 truncate">{cat.category_name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                          </div>
                          <span className="text-xs text-zinc-500 tabular-nums w-10 text-right">{cat.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
