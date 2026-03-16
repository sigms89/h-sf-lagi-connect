// ============================================================
// Húsfélagið.is — AnalyticsPage (v3)
// Removed duplicate KPI cards. Starts with alerts + health score.
// Colors: teal for income, rose for expenses.
// ============================================================

import { useState } from 'react';
import { useTimeRange } from '@/hooks/useTimeRange';
import { Link } from 'react-router-dom';
import { TimeRangeSelector } from '@/components/shared/TimeRangeSelector';
import { StatusSummary } from '@/components/dashboard/StatusSummary';
import { useHealthScore } from '@/hooks/useHealthScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Building2, ArrowUpDown,
  CalendarDays, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useTransactionStats } from '@/hooks/useTransactions';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';

import { formatIskAmount, getCategoryColor } from '@/lib/categories';
import { useFinancialAlerts } from '@/hooks/useAlerts';
import { useVendorAnalytics, useYearOverYear, useFeeAdequacy } from '@/hooks/useAnalytics';
import type { VendorStat, YearOverYearRow } from '@/hooks/useAnalytics';

// ── Trend indicator ───────────────────────────────────────────────────────────

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')
    return <TrendingUp className="h-3.5 w-3.5 text-rose-500" aria-label="Hækkandi" />;
  if (trend === 'down')
    return <TrendingDown className="h-3.5 w-3.5 text-teal-600" aria-label="Lækkandi" />;
  return <Minus className="h-3.5 w-3.5 text-zinc-400" aria-label="Stöðugt" />;
}

// ── Vendor analysis table ─────────────────────────────────────────────────────

type VendorSortKey = 'vendor' | 'count' | 'total' | 'avgPerTx';

function VendorTable({ data, isLoading }: { data: VendorStat[]; isLoading: boolean }) {
  const [sortKey, setSortKey] = useState<VendorSortKey>('total');
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: VendorSortKey) {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...data].sort((a, b) => {
    let av: string | number = a[sortKey];
    let bv: string | number = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string')
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function SortIcon({ col }: { col: VendorSortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortAsc ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Stærstu birgjar (topp 10)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500">Engar færslur til greiningar</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><button onClick={() => handleSort('vendor')} className="flex items-center text-xs font-semibold hover:text-foreground">Birgi <SortIcon col="vendor" /></button></TableHead>
                <TableHead className="text-right"><button onClick={() => handleSort('count')} className="flex items-center ml-auto text-xs font-semibold hover:text-foreground">Fjöldi <SortIcon col="count" /></button></TableHead>
                <TableHead className="text-right"><button onClick={() => handleSort('total')} className="flex items-center ml-auto text-xs font-semibold hover:text-foreground">Samtals <SortIcon col="total" /></button></TableHead>
                <TableHead className="text-right"><button onClick={() => handleSort('avgPerTx')} className="flex items-center ml-auto text-xs font-semibold hover:text-foreground">Meðaltal/færslu <SortIcon col="avgPerTx" /></button></TableHead>
                <TableHead className="text-center">Þróun</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row, i) => (
                <TableRow key={row.vendor}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                      <Link to={`/vendors/${encodeURIComponent(row.vendor)}`} className="text-sm font-medium truncate max-w-[180px] hover:underline hover:text-teal-600 transition-colors">
                        {row.vendor}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-medium">{formatIskAmount(row.total)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-zinc-500">{formatIskAmount(row.avgPerTx)}</TableCell>
                  <TableCell className="text-center"><TrendIndicator trend={row.trend} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Year-over-year table ──────────────────────────────────────────────────────

function YoYTable({ data, isLoading }: { data: YearOverYearRow[]; isLoading: boolean }) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Samanburður ár yfir ár
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500">Þarf gögn frá bæði {lastYear} og {thisYear} til samanburðar</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Flokkur</TableHead>
                <TableHead className="text-right text-xs font-semibold">{lastYear}</TableHead>
                <TableHead className="text-right text-xs font-semibold">{thisYear}</TableHead>
                <TableHead className="text-right text-xs font-semibold">Breyting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const colors = getCategoryColor(row.color);
                const isIncrease = row.change > 0;
                const changeAbs = Math.abs(row.change);
                return (
                  <TableRow key={`${row.category}-${row.lastYear}-${row.thisYear}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                        <span className="text-sm truncate max-w-[160px]">{row.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-zinc-500">{formatIskAmount(row.lastYear)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">{formatIskAmount(row.thisYear)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isIncrease ? 'text-rose-600' : 'text-teal-600'}`}>
                        {isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isIncrease ? '+' : '-'}{changeAbs.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Fee adequacy card ─────────────────────────────────────────────────────────

function FeeAdequacyCard({
  monthlyIncome, monthlyExpenses, deficit, neededIncrease, isAdequate, isLoading,
}: {
  monthlyIncome: number; monthlyExpenses: number; deficit: number; neededIncrease: number; isAdequate: boolean; isLoading: boolean;
}) {
  const surplus = -deficit;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {isAdequate ? <ShieldCheck className="h-4 w-4 text-teal-600" /> : <ShieldAlert className="h-4 w-4 text-rose-500" />}
          Húsgjaldagreining (mánaðarlegt meðaltal, 12 mán.)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Mánaðarlegar tekjur</p>
                <p className="text-base font-bold text-teal-600 tabular-nums">{formatIskAmount(monthlyIncome)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Mánaðarleg gjöld</p>
                <p className="text-base font-bold text-rose-600 tabular-nums">{formatIskAmount(monthlyExpenses)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">{surplus >= 0 ? 'Afgangur' : 'Halli'}</p>
                <p className={`text-base font-bold tabular-nums ${surplus >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                  {surplus >= 0 ? '+' : ''}{formatIskAmount(surplus)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Tekjur sem % af gjöldum</span>
                <span>{monthlyExpenses > 0 ? ((monthlyIncome / monthlyExpenses) * 100).toFixed(0) : 100}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAdequate ? 'bg-teal-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(monthlyExpenses > 0 ? (monthlyIncome / monthlyExpenses) * 100 : 100, 100)}%` }}
                />
              </div>
            </div>

            {!isAdequate && neededIncrease > 0 && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                <p className="text-sm font-medium text-rose-800">Ráðlögð hækkun húsgjalda</p>
                <p className="text-xl font-bold text-rose-700 mt-0.5 tabular-nums">
                  +{formatIskAmount(neededIncrease)}
                  <span className="text-sm font-normal ml-1">á íbúð á mánuði</span>
                </p>
                <p className="text-xs text-rose-600 mt-1">Þetta myndi jafna tekjur og gjöld að meðaltali</p>
              </div>
            )}

            {isAdequate && (
              <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <p className="text-sm text-teal-800">Húsgjöld standa vel undir rekstrarkostnaði</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;
  const numUnits = association?.num_units ?? 1;

  const { range } = useTimeRange();
  const { data: stats, isLoading: statsLoading } = useTransactionStats(associationId, range.from);
  const { data: alerts = [], isLoading: alertsLoading } = useFinancialAlerts(associationId);
  const { data: vendorData = [], isLoading: vendorLoading } = useVendorAnalytics(associationId);
  const { data: yoyData = [], isLoading: yoyLoading } = useYearOverYear(associationId);
  const { data: feeData, isLoading: feeLoading } = useFeeAdequacy(associationId, numUnits);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Greining</h2>
          
        </div>
        <TimeRangeSelector />
      </div>

      {/* ── Alerts banner ─────────────────────────────────────── */}
      {!alertsLoading && alerts.length > 0 && (
        <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
          criticalCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <Bell className={`h-5 w-5 flex-shrink-0 ${criticalCount > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-semibold ${criticalCount > 0 ? 'text-rose-800' : 'text-amber-800'}`}>
                {criticalCount > 0
                  ? `${criticalCount} mikilvæg${criticalCount === 1 ? '' : 'ar'} viðvörun${criticalCount === 1 ? '' : 'ir'}`
                  : `${warningCount} viðvörun${warningCount === 1 ? '' : 'ir'}`}
              </p>
              <p className={`text-xs ${criticalCount > 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                {alerts.length === 1 ? '1 viðvörun og tillaga' : `${alerts.length} viðvaranir og tillögur`} samtals
              </p>
            </div>
          </div>
          <a href="/alerts">
            <Button size="sm" variant="outline" className={`flex-shrink-0 ${
              criticalCount > 0 ? 'border-rose-300 text-rose-700 hover:bg-rose-100' : 'border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}>
              Sjá allar <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </a>
        </div>
      )}

      {/* ── Health Score ──────────────────────────────────────── */}
      {associationId && (
        <HealthScoreCard associationId={associationId} variant="full" />
      )}

      {/* ── Monthly Trend Chart ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Mánaðarleg þróun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={stats?.monthly_data ?? []} isLoading={statsLoading} bare />
        </CardContent>
      </Card>

      {/* ── Category Breakdown ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Stærstu kostnaðarflokkar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (stats?.category_breakdown ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">Engar færslur enn — hlaðið upp gögnum til að sjá greiningu</div>
          ) : (
            <div className="space-y-2">
              {(stats?.category_breakdown ?? []).slice(0, 8).map((cat, i) => (
                <div key={cat.category_id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-zinc-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{cat.category_name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="w-24 h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                    </div>
                    <span className="text-sm tabular-nums text-right w-28">{formatIskAmount(cat.total)}</span>
                    <span className="text-xs text-zinc-500 w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Vendor Analysis ────────────────────────────────── */}
      <VendorTable data={vendorData} isLoading={vendorLoading} />

      {/* ── Year-over-Year ─────────────────────────────────── */}
      <YoYTable data={yoyData} isLoading={yoyLoading} />

      {/* ── Fee Adequacy ───────────────────────────────────── */}
      <FeeAdequacyCard
        monthlyIncome={feeData?.monthlyIncome ?? 0}
        monthlyExpenses={feeData?.monthlyExpenses ?? 0}
        deficit={feeData?.deficit ?? 0}
        neededIncrease={feeData?.neededIncrease ?? 0}
        isAdequate={feeData?.isAdequate ?? true}
        isLoading={feeLoading}
      />
    </div>
  );
}
