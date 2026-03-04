// ============================================================
// Húsfélagið.is — AdminBidRequestsTab (NEW)
// Global view of ALL bid_requests across all associations
// Table: title, association, category, status, deadline, bid_count, created_at
// Filter by status, search by title, paginated
// Click row to expand and view bids
// ============================================================

import { useState, useCallback, Fragment } from 'react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileX,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllBidRequests, type AdminBidRequest } from '@/hooks/useAdminExtended';
import { db } from '@/integrations/supabase/db';
import { useQuery } from '@tanstack/react-query';
import type { Bid } from '@/types/database';

// ============================================================
// Constants
// ============================================================

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  open: 'Opinn',
  closed: 'Lokað',
  awarded: 'Veitt',
  cancelled: 'Afgreitt',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  closed: 'secondary',
  awarded: 'outline',
  cancelled: 'destructive',
};

const BID_STATUS_LABELS: Record<string, string> = {
  pending: 'Í bið',
  accepted: 'Samþykkt',
  rejected: 'Hafnað',
  withdrawn: 'Dregið til baka',
};

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd. MMM yyyy', { locale: is });
  } catch {
    return iso;
  }
}

function formatISK(amount: number): string {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// BidDetail — expanded row showing bids for a bid_request
// ============================================================

interface BidDetailProps {
  bidRequestId: string;
}

function BidDetail({ bidRequestId }: BidDetailProps) {
  const { data: bids, isLoading } = useQuery({
    queryKey: ['admin-bid-detail', bidRequestId],
    queryFn: async (): Promise<Bid[]> => {
      const { data, error } = await db
        .from('bids')
        .select(`
          *,
          provider:service_providers(id, company_name, email)
        `)
        .eq('bid_request_id', bidRequestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Bid[];
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-1.5 bg-muted/30">
        <Skeleton className="h-7 w-full rounded" />
        <Skeleton className="h-7 w-full rounded" />
      </div>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <div className="px-4 py-4 bg-muted/30 text-xs text-muted-foreground text-center">
        Engin tilboð hafa borist
      </div>
    );
  }

  return (
    <div className="bg-muted/30 border-t">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs pl-10">Þjónustuaðili</TableHead>
            <TableHead className="text-xs">Upphæð</TableHead>
            <TableHead className="text-xs">Staða</TableHead>
            <TableHead className="text-xs">Gildir til</TableHead>
            <TableHead className="text-xs">Stofnað</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.map((bid) => (
            <TableRow key={bid.id} className="bg-transparent">
              <TableCell className="text-xs pl-10">
                {(bid as any).provider?.company_name ?? (
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {bid.provider_id.slice(0, 8)}…
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs tabular-nums font-medium">
                {formatISK(bid.amount)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={bid.status === 'accepted' ? 'default' : 'outline'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {BID_STATUS_LABELS[bid.status] ?? bid.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground tabular-nums">
                {formatDate(bid.valid_until)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground tabular-nums">
                {formatDate(bid.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================
// AdminBidRequestsTab
// ============================================================

export function AdminBidRequestsTab() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAllBidRequests(
    statusFilter !== 'all' ? statusFilter : undefined,
    search || undefined,
    page,
    PAGE_SIZE
  );

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Tilboðsferlar</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {data
                ? `${data.count.toLocaleString('is-IS')} ferlar samtals`
                : 'Hleður...'}
            </CardDescription>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Allar stöður" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Allar stöður</SelectItem>
              <SelectItem value="open">Opinn</SelectItem>
              <SelectItem value="closed">Lokað</SelectItem>
              <SelectItem value="awarded">Veitt</SelectItem>
              <SelectItem value="cancelled">Afgreitt</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Leita að titli..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleSearch}>
            Leita
          </Button>

          {(search || statusFilter !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setStatusFilter('all');
                setPage(1);
              }}
            >
              Hreinsa
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <FileX className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all'
                ? 'Engir tilboðsferlar fundust'
                : 'Engir tilboðsferlar til staðar'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-6" />
                  <TableHead className="text-xs">Titill</TableHead>
                  <TableHead className="text-xs">Húsfélag</TableHead>
                  <TableHead className="text-xs w-32">Flokkur</TableHead>
                  <TableHead className="text-xs w-24">Staða</TableHead>
                  <TableHead className="text-xs w-24">Frestur</TableHead>
                  <TableHead className="text-xs w-16 text-center">Tilboð</TableHead>
                  <TableHead className="text-xs w-28">Stofnað</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((req) => (
                  <Fragment key={req.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(req.id)}
                    >
                      <TableCell className="text-center">
                        {expandedId === req.id ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">
                        {req.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                        {req.association?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {req.category?.name_is ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANTS[req.status] ?? 'outline'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {STATUS_LABELS[req.status] ?? req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(req.deadline)}
                      </TableCell>
                      <TableCell className="text-xs text-center tabular-nums font-medium">
                        {req.bid_count}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(req.created_at)}
                      </TableCell>
                    </TableRow>

                    {expandedId === req.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <BidDetail bidRequestId={req.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              Síða {page} af {totalPages} · {data?.count.toLocaleString('is-IS')} ferlar
            </span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
