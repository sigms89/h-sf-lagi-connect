// ============================================================
// VendorDetailPage.tsx
// Full-page view for a single vendor.
// Route: /vendors/:vendorName
// ============================================================

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useVendorDetail } from '@/hooks/useVendorDetail';
import { formatIskAmount } from '@/lib/categories';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell,
} from 'recharts';

const BAR_COLOR = '#e11d48';
const IS_SHORT_MONTHS = [
  'jan.', 'feb.', 'mar.', 'apr.', 'maí', 'jún.',
  'júl.', 'ágú.', 'sep.', 'okt.', 'nóv.', 'des.',
];

type VendorStatus = 'critical' | 'attention' | 'normal';

function statusBadgeClass(status: VendorStatus): string {
  switch (status) {
    case 'critical': return 'bg-red-50 text-red-700 border border-red-200';
    case 'attention': return 'bg-amber-50 text-amber-700 border border-amber-200';
    default: return 'bg-green-50 text-green-700 border border-green-200';
  }
}

function statusLabel(status: VendorStatus): string {
  switch (status) {
    case 'critical': return 'GAUMGÆFILEGT';
    case 'attention': return 'ATHUGAVERT';
    default: return 'Í LAGI';
  }
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-popover-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground tabular-nums">{formatIskAmount(payload[0].value)}</p>
    </div>
  );
}

function pctChange(prev: number, curr: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">-</span>;
  const up = pct > 0;
  const neutral = Math.abs(pct) < 0.5;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums',
      neutral ? 'text-muted-foreground' : up ? 'text-red-600' : 'text-emerald-600')}>
      {neutral ? <Minus className="h-3 w-3" /> : up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-4 pb-4 px-5">
        <p className="text-xs text-muted-foreground mb-1 leading-none">{label}</p>
        <p className={cn('text-xl font-bold tabular-nums tracking-tight', valueClass ?? 'text-foreground')}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function VendorDetailPage() {
  const { vendorName: encodedName } = useParams<{ vendorName: string }>();
  const navigate = useNavigate();
  const { data: association } = useCurrentAssociation();

  const vendorName = encodedName ? decodeURIComponent(encodedName) : '';
  const associationId = association?.id ?? '';
  const { data, isLoading } = useVendorDetail(associationId, vendorName);

  // Parse "yyyy-MM" into chart-friendly labels
  const chartData = useMemo(() => {
    if (!data?.monthlyHistory) return [];
    return data.monthlyHistory.map((m) => {
      const [yearStr, monthStr] = m.month.split('-');
      const monthIdx = parseInt(monthStr, 10) - 1;
      const yearShort = yearStr.slice(2);
      return { label: `${IS_SHORT_MONTHS[monthIdx]} ${yearShort}`, amount: m.total };
    });
  }, [data]);

  const yearTotals = useMemo(() => {
    if (!data?.yearTotals) return [];
    return data.yearTotals;
  }, [data]);

  const showYoY = yearTotals.length >= 2;

  function formatYAxis(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} m.`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)} þ.`;
    return String(value);
  }

  if (!associationId || !vendorName) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Lánardrottinn fannst ekki.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-1 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Til baka
        </Button>
        <h1 className="text-xl font-semibold text-foreground flex-1 min-w-0 truncate">{vendorName}</h1>
        {isLoading ? <Skeleton className="h-6 w-20 rounded-full" /> : data ? (
          <Badge variant="outline" className={cn('text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full', statusBadgeClass(data.status as VendorStatus))}>
            {statusLabel(data.status as VendorStatus)}
          </Badge>
        ) : null}
      </div>

      {/* Alert */}
      {!isLoading && data && (data.status === 'attention' || data.status === 'critical') && (
        <div className={cn('flex gap-3 rounded-xl border p-4', data.status === 'critical' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800')} role="alert">
          <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-0.5', data.status === 'critical' ? 'text-red-500' : 'text-amber-500')} />
          <div>
            <p className="text-sm font-semibold mb-0.5">Greining Eftirlitsvélar</p>
            <p className="text-xs leading-relaxed">{data.statusText}</p>
          </div>
        </div>
      )}

      {/* KPI + Chart + YoY */}
      {isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Miðgildi færslu" value={formatIskAmount(data.avgPerTx ?? 0)} />
            <KpiCard label="Hæsta færsla" value={formatIskAmount(data.maxTx ?? 0)} />
            <KpiCard label="Þróun (seinni hluti)" value={data.trendPct != null ? `${data.trendPct > 0 ? '+' : ''}${data.trendPct.toFixed(1)}%` : '—'}
              valueClass={data.trendPct == null ? 'text-muted-foreground' : data.trendPct > 5 ? 'text-red-600' : data.trendPct < -5 ? 'text-emerald-600' : 'text-foreground'} />
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Greiðslusaga</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={chartData.length > 18 ? 2 : 0} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={56} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                    <Bar dataKey="amount" radius={[3, 3, 0, 0]} maxBarSize={40}>
                      {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={BAR_COLOR} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showYoY && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Ár á móti ári</CardTitle></CardHeader>
              <CardContent className="pt-0 px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 text-xs">Ár</TableHead>
                      <TableHead className="text-xs text-right">Heildargreiðslur</TableHead>
                      <TableHead className="pr-6 text-xs text-right">Breyting</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearTotals.map((row, i) => {
                      const prev = i > 0 ? yearTotals[i - 1].total : null;
                      const pct = prev !== null ? pctChange(prev, row.total) : null;
                      return (
                        <TableRow key={row.year} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium tabular-nums">{row.year}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatIskAmount(row.total)}</TableCell>
                          <TableCell className="pr-6 text-right"><PctBadge pct={pct} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Engar upplýsingar fundust um þennan lánardrottin.</div>
      )}
    </div>
  );
}
