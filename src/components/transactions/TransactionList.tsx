// ============================================================
// Húsfélagið.is — Transaction List Component
// Full-featured paginated table with filtering and category editing
// ============================================================

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  FileText,
  X,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useTransactions, useUpdateTransactionCategory, useLatestBatch, useDeleteBatch } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { getCategoryColor, getCategoryHex, formatIskAmount } from '@/lib/categories';
import { formatDateIs } from '@/lib/parseTransactions';
import type { TransactionFilters } from '@/types/database';

const PAGE_SIZE = 25;

interface TransactionListProps {
  associationId: string;
}

export function TransactionList({ associationId }: TransactionListProps) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const updateCategory = useUpdateTransactionCategory();
  const { data: association } = useCurrentAssociation();
  const { data: latestBatch } = useLatestBatch(associationId);
  const deleteBatch = useDeleteBatch();
  const hasPaidTier =
    association?.subscription_tier === 'plus' ||
    association?.subscription_tier === 'pro';

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    page_size: PAGE_SIZE,
  });

  const { data, isLoading } = useTransactions(associationId, filters);
  const transactions = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ============================================================
  // FILTER HANDLERS
  // ============================================================
  const updateFilter = useCallback(
    (key: keyof TransactionFilters, value: TransactionFilters[typeof key]) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    []
  );

  const clearFilters = () => {
    setFilters({ page: 1, page_size: PAGE_SIZE });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.category_id ||
    filters.date_from ||
    filters.date_to ||
    filters.is_income !== undefined ||
    filters.is_uncategorized
  );

  // ============================================================
  // CATEGORY CHANGE
  // ============================================================
  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    if (!user) return;
    await updateCategory.mutateAsync({
      transactionId,
      categoryId: categoryId === 'none' ? null : categoryId,
      userId: user.id,
      associationId,
    });
  };

  // ============================================================
  // CSV EXPORT
  // ============================================================
  const handleExport = () => {
    if (!transactions.length || !hasPaidTier) return;
    const headers = ['Dagsetning', 'Lýsing', 'Upphæð', 'Staða', 'Flokkur', 'Tegund'];
    const rows = transactions.map((tx) => [
      formatDateIs(tx.date),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toString().replace('.', ','),
      tx.balance?.toString().replace('.', ',') ?? '',
      tx.category?.name_is ?? 'Óflokkað',
      tx.is_income ? 'Tekjur' : 'Gjöld',
    ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `husfelag-faerslur-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // PDF EXPORT
  // ============================================================
  const handlePdfExport = () => {
    if (!transactions.length || !hasPaidTier) return;
    const rows = transactions
      .map(
        (tx) => `
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${formatDateIs(tx.date)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${tx.description}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${formatIskAmount(tx.amount)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${tx.category?.name_is ?? 'Óflokkað'}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html><head><title>Færslur — ${association?.name ?? 'Húsfélag'}</title>
      <style>body{font-family:system-ui,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;padding:6px 8px;border-bottom:2px solid #333;font-weight:600}h1{font-size:16px;margin-bottom:4px}p{color:#666;font-size:12px;margin-bottom:16px}</style>
      </head><body>
      <h1>Færslur — ${association?.name ?? ''}</h1>
      <p>Útflutningur ${new Date().toLocaleDateString('is-IS')}</p>
      <table>
        <thead><tr><th>Dagsetning</th><th>Lýsing</th><th style="text-align:right">Upphæð</th><th>Flokkur</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Leita í lýsingu..."
            className="pl-9 h-9"
            value={filters.search ?? ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
          />
        </div>

        {/* Category filter */}
        <Select
          value={filters.category_id ?? 'all'}
          onValueChange={(val) =>
            updateFilter('category_id', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="h-9 w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Allir flokkar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Allir flokkar</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name_is}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select
          value={
            filters.is_uncategorized
              ? 'uncategorized'
              : filters.is_income === true
              ? 'income'
              : filters.is_income === false
              ? 'expense'
              : 'all'
          }
          onValueChange={(val) => {
            if (val === 'all') {
              setFilters((prev) => ({
                ...prev,
                is_income: undefined,
                is_uncategorized: undefined,
                page: 1,
              }));
            } else if (val === 'income') {
              setFilters((prev) => ({
                ...prev,
                is_income: true,
                is_uncategorized: undefined,
                page: 1,
              }));
            } else if (val === 'expense') {
              setFilters((prev) => ({
                ...prev,
                is_income: false,
                is_uncategorized: undefined,
                page: 1,
              }));
            } else if (val === 'uncategorized') {
              setFilters((prev) => ({
                ...prev,
                is_income: undefined,
                is_uncategorized: true,
                page: 1,
              }));
            }
          }}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Allt</SelectItem>
            <SelectItem value="income">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-teal-600" /> Tekjur
              </span>
            </SelectItem>
            <SelectItem value="expense">
              <span className="flex items-center gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-rose-600" /> Gjöld
              </span>
            </SelectItem>
            <SelectItem value="uncategorized">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> Óflokkað
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <Input
          type="date"
          className="h-9 w-36 text-xs"
          value={filters.date_from ?? ''}
          onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
          title="Frá dagsetning"
        />
        <Input
          type="date"
          className="h-9 w-36 text-xs"
          value={filters.date_to ?? ''}
          onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
          title="Til dagsetning"
        />

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-9"
              disabled={!transactions.length}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Sækja
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={hasPaidTier ? handleExport : undefined}
              disabled={!hasPaidTier}
              className={!hasPaidTier ? 'opacity-50' : ''}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
              {!hasPaidTier && (
                <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1">
                  Plus+
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={hasPaidTier ? handlePdfExport : undefined}
              disabled={!hasPaidTier}
              className={!hasPaidTier ? 'opacity-50' : ''}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
              {!hasPaidTier && (
                <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1">
                  Plus+
                </Badge>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Undo last upload + Count info */}
      {latestBatch && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-3 py-2 text-sm">
          <Undo2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground flex-1">
            Síðasta upphleðsla: <span className="font-medium text-foreground">{latestBatch.file_name ?? 'Ónefnd skrá'}</span>
            {' — '}
            {latestBatch.row_count ?? '?'} færslur
            {latestBatch.created_at && `, ${format(new Date(latestBatch.created_at), 'd. MMM yyyy HH:mm', { locale: is })}`}
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Afturkalla
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Afturkalla upphleðslu?</AlertDialogTitle>
                <AlertDialogDescription>
                  Þetta mun eyða <span className="font-semibold">{latestBatch.row_count ?? '?'} færslum</span> úr
                  {' '}<span className="font-semibold">{latestBatch.file_name ?? 'ónefndri skrá'}</span>.
                  Þetta er óafturkræft.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hætta við</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => deleteBatch.mutate({ batchId: latestBatch.id, associationId })}
                  disabled={deleteBatch.isPending}
                >
                  {deleteBatch.isPending ? 'Eyði...' : 'Eyða færslum'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading
            ? 'Sæki færslur...'
            : `${totalCount.toLocaleString('is-IS')} færslur`}
        </span>
        {totalPages > 1 && (
          <span>
            Bls. {filters.page} / {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24">Dagsetning</TableHead>
                <TableHead>Lýsing</TableHead>
                <TableHead className="text-right w-32">Upphæð</TableHead>
                <TableHead className="w-44">Flokkur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    {hasActiveFilters
                      ? 'Engar færslur fundust með þessum skilyrðum'
                      : 'Engar færslur skráðar ennþá'}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const isUncategorized = !tx.category_id;
                  const catColor = tx.category?.color ?? (isUncategorized ? 'yellow' : 'neutral');

                  return (
                    <TableRow
                      key={tx.id}
                      className={isUncategorized ? 'bg-yellow-50/40 hover:bg-yellow-50/70' : undefined}
                    >
                      {/* Date */}
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatDateIs(tx.date)}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="text-sm">
                        <span className="block truncate max-w-[280px]" title={tx.description}>
                          {tx.description}
                        </span>
                        {tx.manually_categorized && (
                          <span className="text-xs text-muted-foreground">handflokkað</span>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell
                        className={`text-right text-sm font-medium whitespace-nowrap ${
                          tx.is_income ? 'text-teal-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.is_income ? '+' : '-'}
                        {formatIskAmount(Math.abs(tx.amount))}
                      </TableCell>

                      {/* Balance */}
                      <TableCell className="text-right text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {tx.balance != null ? formatIskAmount(tx.balance) : '—'}
                      </TableCell>

                      {/* Category — click to change */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted transition-colors"
                              title="Breyta flokki"
                            >
                              <Badge
                                variant="secondary"
                                className={`text-xs gap-1 ${getCategoryColor(catColor).badge}`}
                              >
                                {isUncategorized && (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {tx.category?.name_is ?? 'Óflokkað'}
                              </Badge>
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            {categories.map((cat) => (
                              <DropdownMenuItem
                                key={cat.id}
                                onClick={() => handleCategoryChange(tx.id, cat.id)}
                                className="text-sm"
                              >
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                                  style={{ backgroundColor: getCategoryHex(cat.color) }}
                                />
                                {cat.name_is}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Type icon */}
                      <TableCell className="text-center">
                        {tx.is_income ? (
                          <TrendingUp className="h-4 w-4 text-teal-500 mx-auto" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-500 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            disabled={!filters.page || filters.page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Fyrri
          </Button>
          <span className="text-sm text-muted-foreground">
            {filters.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            disabled={!filters.page || filters.page >= totalPages}
          >
            Næsta
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
