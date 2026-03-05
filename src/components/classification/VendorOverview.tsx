// ============================================================
// Húsfélagið.is — VendorOverview (Updated: Fasi 4)
// Full-page smart vendor/payer overview. Groups all transactions
// by description, shows current vs. suggested category, and
// allows bulk reclassification with optional rule creation.
// Added: MergeSuggestionBar at top, clickable vendor name links.
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MergeSuggestionBar } from '@/components/shared/MergeSuggestionBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Tags,
  AlertTriangle,
  Building2,
  Users,
} from 'lucide-react';
import { useVendorSummary } from '@/hooks/useClassification';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryColor, formatIskAmount } from '@/lib/categories';
import { BulkReclassifyDialog } from '@/components/classification/BulkReclassifyDialog';
import { AutoClassifyBar } from '@/components/classification/AutoClassifyBar';
import type { VendorSummaryItem } from '@/hooks/useClassification';

// ============================================================
// TYPES
// ============================================================

type SortKey = 'vendor' | 'count' | 'total';
type SortDir = 'asc' | 'desc';

interface VendorOverviewProps {
  associationId: string;
}

interface DialogState {
  open: boolean;
  item: VendorSummaryItem | null;
}

// ============================================================
// HELPERS
// ============================================================

function SortIcon({
  column,
  current,
  dir,
}: {
  column: SortKey;
  current: SortKey;
  dir: SortDir;
}) {
  if (current !== column)
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 ml-1" />;
  return dir === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[#1e3a5f] ml-1" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[#1e3a5f] ml-1" />
  );
}

// ============================================================
// VENDOR TABLE (shared between income/expense tabs)
// ============================================================

interface VendorTableProps {
  items: VendorSummaryItem[];
  isLoading: boolean;
  isIncome: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onReclassify: (item: VendorSummaryItem) => void;
  categoryMap: Map<string, { id: string; color: string | null; name_is: string }>;
}

function VendorTable({
  items,
  isLoading,
  isIncome,
  sortKey,
  sortDir,
  onSort,
  onReclassify,
  categoryMap,
}: VendorTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[40%]">Aðili</TableHead>
              <TableHead className="w-20 text-right">Færslur</TableHead>
              <TableHead className="w-32 text-right">Samtals</TableHead>
              <TableHead className="w-36">Flokkur</TableHead>
              <TableHead className="w-36">Tillaga</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg flex flex-col items-center justify-center py-16 text-center">
        {isIncome ? (
          <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
        ) : (
          <TrendingDown className="h-10 w-10 text-muted-foreground/30 mb-3" />
        )}
        <p className="text-sm font-medium text-muted-foreground">
          Engar færslur fundust
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Prófaðu að breyta leitarskilyrðum
        </p>
      </div>
    );
  }

  const SortHeader = ({
    column,
    children,
    className,
  }: {
    column: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ''}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-0">
        {children}
        <SortIcon column={column} current={sortKey} dir={sortDir} />
      </div>
    </TableHead>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <SortHeader column="vendor" className="w-[38%]">
                Aðili
              </SortHeader>
              <SortHeader column="count" className="w-20 text-right justify-end">
                <span className="ml-auto">Færslur</span>
              </SortHeader>
              <SortHeader column="total" className="w-32 text-right justify-end">
                <span className="ml-auto">Samtals</span>
              </SortHeader>
              <TableHead className="w-36">Flokkur</TableHead>
              <TableHead className="w-36">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#0d9488]" />
                  Tillaga
                </span>
              </TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const hasSuggestion =
                item.suggestedCategory &&
                item.suggestedCategory !== 'Óflokkað' &&
                item.suggestedCategory !== item.currentCategory;

              // Find category ids/colors by name for badge rendering
              const currentCat = item.currentCategory
                ? [...categoryMap.values()].find(
                    (c) => c.name_is === item.currentCategory
                  ) ?? null
                : null;
              const suggestedCat = item.suggestedCategory
                ? [...categoryMap.values()].find(
                    (c) => c.name_is === item.suggestedCategory
                  ) ?? null
                : null;

              const amountNeg = item.total < 0;

              return (
                <TableRow
                  key={item.vendor}
                  className={
                    !item.currentCategory
                      ? 'bg-yellow-50/40 hover:bg-yellow-50/70'
                      : undefined
                  }
                >
                  {/* Vendor name */}
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {!item.currentCategory && (
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                      <span
                        className="truncate font-medium hover:underline hover:text-[#0d9488] transition-colors cursor-pointer"
                        title={item.vendor}
                      >
                        {item.vendor ? (
                          <Link to={`/vendors/${encodeURIComponent(item.vendor)}`}>
                            {item.vendor}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">
                            (Engin lýsing)
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Count */}
                  <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                    {item.count.toLocaleString('is-IS')}
                  </TableCell>

                  {/* Total */}
                  <TableCell
                    className={`text-right text-sm font-medium tabular-nums whitespace-nowrap ${
                      amountNeg ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {amountNeg ? '−' : '+'}
                    {formatIskAmount(Math.abs(item.total))}
                  </TableCell>

                  {/* Current category */}
                  <TableCell>
                    {currentCat ? (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          getCategoryColor(currentCat.color).badge
                        }`}
                      >
                        {currentCat.name_is}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-yellow-100 text-yellow-800"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Óflokkað
                      </Badge>
                    )}
                  </TableCell>

                  {/* Suggested category */}
                  <TableCell>
                    {hasSuggestion && suggestedCat ? (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          getCategoryColor(suggestedCat.color).badge
                        } ring-1 ring-[#0d9488]/40`}
                      >
                        <Sparkles className="h-2.5 w-2.5 mr-1 text-[#0d9488]" />
                        {suggestedCat.name_is}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5 border-[#1e3a5f]/20 text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
                      onClick={() => onReclassify(item)}
                    >
                      <Tags className="h-3 w-3 mr-1.5" />
                      Endurflokka allt
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function VendorOverview({ associationId }: VendorOverviewProps) {
  const { data: vendorSummary = [], isLoading } = useVendorSummary(associationId);
  const { data: categories = [] } = useCategories();

  // Build a map: category name_is → { id, color, name_is }
  const categoryMap = useMemo(() => {
    const map = new Map<string, { id: string; color: string | null; name_is: string }>();
    for (const cat of categories) {
      map.set(cat.id, { id: cat.id, color: cat.color, name_is: cat.name_is });
    }
    return map;
  }, [categories]);

  // Also build name→id map for suggested category lookup
  const categoryByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.name_is, cat.id);
    }
    return map;
  }, [categories]);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [dialog, setDialog] = useState<DialogState>({ open: false, item: null });

  // ============================================================
  // SORTING
  // ============================================================
  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'vendor' ? 'asc' : 'desc');
      }
    },
    [sortKey]
  );

  // ============================================================
  // FILTER + SORT
  // ============================================================
  const processedItems = useMemo(() => {
    const isIncome = activeTab === 'income';

    // Split by income/expense heuristic: positive total = income
    let filtered = vendorSummary.filter((v) =>
      isIncome ? v.total > 0 : v.total <= 0
    );

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((v) =>
        v.vendor.toLowerCase().includes(q) ||
        (v.currentCategory ?? '').toLowerCase().includes(q) ||
        (v.suggestedCategory ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'vendor') {
        cmp = a.vendor.localeCompare(b.vendor, 'is');
      } else if (sortKey === 'count') {
        cmp = a.count - b.count;
      } else if (sortKey === 'total') {
        cmp = Math.abs(a.total) - Math.abs(b.total);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [vendorSummary, activeTab, search, sortKey, sortDir]);

  // Summary stats for the header
  const incomeVendors = vendorSummary.filter((v) => v.total > 0);
  const expenseVendors = vendorSummary.filter((v) => v.total <= 0);
  const uncategorizedCount = vendorSummary.filter((v) => !v.currentCategory).reduce(
    (s, v) => s + v.count,
    0
  );

  // ============================================================
  // DIALOG HELPERS
  // ============================================================
  const openReclassifyDialog = useCallback((item: VendorSummaryItem) => {
    setDialog({ open: true, item });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false, item: null });
  }, []);

  // Resolve category IDs for dialog
  const dialogCategoryId = dialog.item
    ? dialog.item.currentCategory
      ? (categoryByName.get(dialog.item.currentCategory) ?? null)
      : null
    : null;

  const dialogSuggestedId = dialog.item?.suggestedCategory
    ? (categoryByName.get(dialog.item.suggestedCategory) ?? null)
    : null;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0d9488]" />
            Aðilasýn
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Yfirlit yfir alla gjaldtakendur og greiðendur, flokkað eftir lýsingu
          </p>
        </div>

        {/* Summary pills */}
        {!isLoading && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs gap-1.5">
              <Users className="h-3 w-3" />
              {vendorSummary.length} aðilar
            </Badge>
            {uncategorizedCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs bg-yellow-100 text-yellow-800 gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                {uncategorizedCount.toLocaleString('is-IS')} óflokkað
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* MergeSuggestionBar */}
      <MergeSuggestionBar associationId={associationId} />

      {/* Auto-classify bar */}
      <AutoClassifyBar associationId={associationId} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'income' | 'expense')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="expense" className="gap-1.5 text-sm">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              Kostnaðaraðilar
              {!isLoading && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({expenseVendors.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5 text-sm">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Tekjuaðilar
              {!isLoading && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({incomeVendors.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Leita í aðilum..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="expense" className="mt-3">
          <VendorTable
            items={processedItems}
            isLoading={isLoading}
            isIncome={false}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onReclassify={openReclassifyDialog}
            categoryMap={categoryMap}
          />
        </TabsContent>

        <TabsContent value="income" className="mt-3">
          <VendorTable
            items={processedItems}
            isLoading={isLoading}
            isIncome={true}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onReclassify={openReclassifyDialog}
            categoryMap={categoryMap}
          />
        </TabsContent>
      </Tabs>

      {/* Count footer */}
      {!isLoading && processedItems.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Sýni {processedItems.length.toLocaleString('is-IS')}{' '}
          {activeTab === 'income' ? 'tekjuaðila' : 'kostnaðaraðila'}
          {search && ` (síað)`}
        </p>
      )}

      {/* Bulk reclassify dialog */}
      {dialog.item && (
        <BulkReclassifyDialog
          open={dialog.open}
          onClose={closeDialog}
          vendorName={dialog.item.vendor}
          transactionCount={dialog.item.count}
          totalAmount={dialog.item.total}
          currentCategoryId={dialogCategoryId}
          suggestedCategoryId={dialogSuggestedId}
          associationId={associationId}
        />
      )}
    </div>
  );
}
