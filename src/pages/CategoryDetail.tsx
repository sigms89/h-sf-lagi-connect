import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { is } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface CategoryMonthlyData {
  month: string;
  month_label: string;
  total: number;
}

interface CategoryTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  vendor_name: string | null;
}

interface CategoryInfo {
  id: string;
  name_is: string;
  color: string | null;
}

function useCategoryDetail(
  associationId: string | null | undefined,
  categoryId: string | undefined
) {
  return useQuery({
    queryKey: ['category-detail', associationId, categoryId],
    queryFn: async () => {
      if (!associationId || !categoryId) {
        return { category: null, monthlyData: [], transactions: [], totalSpend: 0 };
      }

      const twelveMonthsAgo = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

      // Fetch category info
      const { data: catData, error: catError } = await db
        .from('categories')
        .select('id, name_is, color')
        .eq('id', categoryId)
        .single();
      if (catError) throw catError;

      const category = catData as CategoryInfo | null;

      // Fetch transactions for this category in the last 12 months
      const { data: txData, error: txError } = await db
        .from('transactions')
        .select(
          'id, date, description, amount, vendor_id, vendor:vendors(name)'
        )
        .eq('association_id', associationId)
        .eq('category_id', categoryId)
        .eq('is_income', false)
        .gte('date', twelveMonthsAgo)
        .order('date', { ascending: false });
      if (txError) throw txError;

      const txList = (txData ?? []) as Array<{
        id: string;
        date: string;
        description: string | null;
        amount: number;
        vendor: { name: string } | null;
      }>;

      const transactions: CategoryTransaction[] = txList.map((tx) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description ?? '',
        amount: tx.amount,
        vendor_name: tx.vendor?.name ?? null,
      }));

      // Build monthly aggregation for the last 12 months
      const monthlyMap = new Map<string, number>();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        monthlyMap.set(format(d, 'yyyy-MM'), 0);
      }
      for (const tx of txList) {
        const monthKey = tx.date.slice(0, 7);
        if (monthlyMap.has(monthKey)) {
          monthlyMap.set(
            monthKey,
            (monthlyMap.get(monthKey) ?? 0) + Math.abs(tx.amount)
          );
        }
      }

      const monthlyData: CategoryMonthlyData[] = Array.from(
        monthlyMap.entries()
      ).map(([month, total]) => ({
        month,
        month_label: format(new Date(month + '-01'), 'MMM yy', { locale: is }),
        total,
      }));

      const totalSpend = txList.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      );

      return { category, monthlyData, transactions, totalSpend };
    },
    enabled: !!associationId && !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

function formatISK(amount: number) {
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${amount < 0 ? '-' : ''}${str} ISK`;
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'd. MMM yyyy', { locale: is });
}

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;

  const { data, isLoading, error } = useCategoryDetail(
    associationId,
    categoryId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !data?.category) {
    return (
      <div className="p-6">
        <Link
          to="/analytics"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Til baka í greiningu
        </Link>
        <p className="text-destructive">Flokkur fannst ekki.</p>
      </div>
    );
  }

  const { category, monthlyData, transactions, totalSpend } = data;
  const categoryColor = category.color ?? '#1e3a5f';

  // Trend: compare last 3mo avg vs previous 3mo avg
  const last3 = monthlyData.slice(-3).reduce((s, m) => s + m.total, 0) / 3;
  const prev3 =
    monthlyData.slice(-6, -3).reduce((s, m) => s + m.total, 0) / 3;
  const trendPct =
    prev3 > 0 ? Math.round(((last3 - prev3) / prev3) * 100) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to="/analytics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Til baka í greiningu
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full shrink-0"
          style={{ backgroundColor: categoryColor }}
        />
        <h1 className="text-xl font-semibold tracking-tight">
          {category.name_is}
        </h1>
        {trendPct !== null && (
          <Badge
            variant="secondary"
            className={
              trendPct > 0
                ? 'bg-rose-100 text-rose-800'
                : trendPct < 0
                ? 'bg-teal-100 text-teal-800'
                : 'bg-gray-100 text-gray-800'
            }
          >
            {trendPct > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : trendPct < 0 ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <Minus className="h-3 w-3 mr-1" />
            )}
            {trendPct > 0 ? '+' : ''}
            {trendPct}% (3 mán.)
          </Badge>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">
              Heildarútgjöld (12 mán.)
            </p>
            <p className="text-xl font-bold">{formatISK(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">
              Fjöldi færslna
            </p>
            <p className="text-xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">
              Mánaðarlegt meðaltal
            </p>
            <p className="text-xl font-bold">
              {formatISK(totalSpend / 12)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Mánaðarleg útgjöld – síðustu 12 mánuðir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={monthlyData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month_label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const abs = Math.abs(Math.round(v));
                  if (abs >= 1_000_000) return `${Math.round(abs / 1_000_000)}M`;
                  if (abs >= 1_000) return `${Math.round(abs / 1_000)}þ`;
                  return abs.toString();
                }}
              />
              <Tooltip
                formatter={(value: number) => [formatISK(value), 'Útgjöld']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="total"
                fill={categoryColor}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Færslur í flokki
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">
              Engar færslur fundust.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dagsetning</TableHead>
                  <TableHead>Lýsing</TableHead>
                  <TableHead>Birgir</TableHead>
                  <TableHead className="text-right">Upphæð</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {tx.description || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.vendor_name || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-rose-600">
                      -{formatISK(Math.abs(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
