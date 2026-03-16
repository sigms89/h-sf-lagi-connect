import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { BenchmarkRow } from '@/hooks/useBenchmarking';
import { formatIskAmount } from '@/lib/categories';

interface BenchmarkChartProps {
  rows: BenchmarkRow[];
  isLoading: boolean;
}

const BRAND_BLUE = '#1e3a5f';
const MEDIAN_TEAL = '#0d9488';
const BAND_COLOR = '#e2e8f0';

function shortenName(name: string): string {
  if (name.length <= 18) return name;
  return name.slice(0, 16) + '…';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  // Find the original row data from the first payload entry
  const rowData = payload[0]?.payload;

  return (
    <div className="bg-white rounded-lg border shadow-sm p-3 text-sm space-y-1 min-w-[200px]">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{formatIskAmount(entry.value, true)}</span>
        </div>
      ))}
      {rowData?.p25 != null && rowData?.p75 != null && (
        <div className="pt-1 border-t mt-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-slate-200" />
            <span>Svið (25.–75.):</span>
            <span className="font-medium tabular-nums">
              {formatIskAmount(rowData.p25, true)} – {formatIskAmount(rowData.p75, true)}
            </span>
          </div>
        </div>
      )}
      {rowData?.comparable != null && (
        <p className="text-xs text-muted-foreground pt-0.5">{rowData.comparable} húsfélög í samanburði</p>
      )}
    </div>
  );
}

export function BenchmarkChart({ rows, isLoading }: BenchmarkChartProps) {
  if (isLoading) return <Skeleton className="h-72 w-full" />;

  // Only show rows with sufficient data
  const validRows = rows.filter((r) => r.status !== 'insufficient');
  if (validRows.length === 0) return null;

  const chartData = validRows.slice(0, 12).map((row) => ({
    name: shortenName(row.categoryName),
    'Þitt húsfélag': Math.round(row.yourCostPerUnit ?? 0),
    'Miðgildi': Math.round(row.median ?? 0),
    p25: Math.round(row.p25 ?? 0),
    p75: Math.round(row.p75 ?? 0),
    comparable: row.comparableInCategory,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Kostnaður á íbúð/mánuð eftir flokki</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Þitt húsfélag samanborið við miðgildi sambærilegra húsfélaga
        </p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barSize={12} barCategoryGap="35%">
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} kr.`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={130} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
          <Bar dataKey="Þitt húsfélag" fill={BRAND_BLUE} radius={[0, 3, 3, 0]} />
          <Bar dataKey="Miðgildi" fill={MEDIAN_TEAL} radius={[0, 3, 3, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
