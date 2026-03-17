import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingDown, Minus, TrendingUp, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { BenchmarkRow, BenchmarkStatus } from '@/hooks/useBenchmarking';
import { formatIskAmount } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { BenchmarkTrendChart } from './BenchmarkTrendChart';

type SortKey = 'categoryName' | 'yourCostPerUnit' | 'median' | 'diffPercent';
type SortDir = 'asc' | 'desc';

interface BenchmarkTableProps {
  rows: BenchmarkRow[];
  isLoading: boolean;
  associationId: string | undefined;
}

function StatusBadge({ status }: { status: BenchmarkStatus }) {
  if (status === 'insufficient') {
    return <Badge className="bg-muted text-muted-foreground border-border gap-1 font-medium"><AlertCircle className="h-3 w-3" />Ekki næg gögn</Badge>;
  }
  if (status === 'below') {
    return <Badge className="bg-teal-50 text-teal-800 border-teal-200 gap-1 font-medium"><TrendingDown className="h-3 w-3" />Undir miðgildi</Badge>;
  }
  if (status === 'above') {
    return <Badge className="bg-rose-50 text-rose-800 border-rose-200 gap-1 font-medium"><TrendingUp className="h-3 w-3" />Yfir miðgildi</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1 font-medium"><Minus className="h-3 w-3" />Nálægt miðgildi</Badge>;
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
}

export function BenchmarkTable({ rows, isLoading, associationId }: BenchmarkTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('diffPercent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    const aVal = sortKey === 'categoryName' ? a.categoryName : (a[sortKey] ?? 0);
    const bVal = sortKey === 'categoryName' ? b.categoryName : (b[sortKey] ?? 0);
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string, 'is') : (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader><TableRow>{['Flokkur', 'Þitt húsfélag', 'Miðgildi', 'Svið', 'Munur', 'Staða'].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">Ekki næg gögn til samanburðar enn sem komið er.</div>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-semibold p-0 hover:bg-transparent" onClick={() => handleSort('categoryName')}>Flokkur<SortIcon column="categoryName" sortKey={sortKey} sortDir={sortDir} /></Button></TableHead>
            <TableHead><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-semibold p-0 hover:bg-transparent" onClick={() => handleSort('yourCostPerUnit')}>Þitt (kr/mán)<SortIcon column="yourCostPerUnit" sortKey={sortKey} sortDir={sortDir} /></Button></TableHead>
            <TableHead><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-semibold p-0 hover:bg-transparent" onClick={() => handleSort('median')}>Miðgildi (kr/mán)<SortIcon column="median" sortKey={sortKey} sortDir={sortDir} /></Button></TableHead>
            <TableHead className="text-xs font-semibold">Svið (25.–75.)</TableHead>
            <TableHead><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-semibold p-0 hover:bg-transparent" onClick={() => handleSort('diffPercent')}>Munur (%)<SortIcon column="diffPercent" sortKey={sortKey} sortDir={sortDir} /></Button></TableHead>
            <TableHead>Staða</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => {
            const isExpanded = expandedRow === row.categoryId;
            const isInsufficient = row.status === 'insufficient';
            return (
              <> 
                <TableRow key={row.categoryId} className={cn('cursor-pointer hover:bg-muted/30 transition-colors', isExpanded && 'bg-muted/20')} onClick={() => setExpandedRow(isExpanded ? null : row.categoryId)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: row.categoryColor }} />
                      <span className="text-sm font-medium">{row.categoryName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{formatIskAmount(row.yourCostPerUnit, true)}</TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {isInsufficient ? <span className="text-xs italic">-</span> : formatIskAmount(row.median ?? 0, true)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {isInsufficient
                      ? <span className="text-xs italic">-</span>
                      : <span>{formatIskAmount(row.p25 ?? 0, true)} – {formatIskAmount(row.p75 ?? 0, true)}</span>
                    }
                  </TableCell>
                  <TableCell>
                    {isInsufficient
                      ? <span className="text-xs italic text-muted-foreground">-</span>
                      : (
                        <span className={cn('text-sm font-semibold tabular-nums', (row.diffPercent ?? 0) < -10 ? 'text-teal-700' : (row.diffPercent ?? 0) > 10 ? 'text-rose-700' : 'text-yellow-700')}>
                          {(row.diffPercent ?? 0) > 0 ? '+' : ''}{(row.diffPercent ?? 0).toFixed(1)}%
                        </span>
                      )
                    }
                  </TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</TableCell>
                </TableRow>
                {isExpanded && associationId && !isInsufficient && (
                  <TableRow key={`${row.categoryId}-expanded`} className="bg-muted/10 hover:bg-muted/10">
                    <TableCell colSpan={7} className="pt-2 pb-4 px-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">Þróun kostnaðar, síðustu 12 mánuðir</span>
                        <span className="text-xs text-muted-foreground">{row.comparableInCategory} húsfélög í samanburði</span>
                      </div>
                      <BenchmarkTrendChart associationId={associationId} categoryId={row.categoryId} numUnits={undefined} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
