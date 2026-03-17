// ============================================================
// Húsfélagið.is — MyBids
// Table of all bids submitted by the provider
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Bid, BidRequest, BidStatus } from '@/types/database';
import { formatIskAmount, getCategoryColor } from '@/lib/categories';
import { useMyBids } from '@/hooks/useServiceProvider';

interface MyBidsProps {
  providerId: string;
}

const BID_STATUS_LABELS: Record<BidStatus, string> = {
  pending: 'Í bið',
  accepted: 'Samþykkt',
  rejected: 'Hafnað',
  withdrawn: 'Afturkallað',
};

const BID_STATUS_CLASSES: Record<BidStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  withdrawn: 'bg-slate-100 text-slate-800 border-slate-200',
};

export function MyBids({ providerId }: MyBidsProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | BidStatus>('all');
  const { data: bids = [], isLoading } = useMyBids(providerId);

  const filtered = bids.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Allar stöður</SelectItem>
            <SelectItem value="pending">Í bið</SelectItem>
            <SelectItem value="accepted">Samþykkt</SelectItem>
            <SelectItem value="rejected">Hafnað</SelectItem>
            <SelectItem value="withdrawn">Afturkallað</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} tilboð</span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed py-14 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">Engin tilboð enn</p>
          <p className="text-xs text-muted-foreground mt-1">
            Send tilboð munu birtast hér.
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Tilboðsbeiðni</TableHead>
                <TableHead>Upphæð</TableHead>
                <TableHead>Staða</TableHead>
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
                <TableHead className="hidden md:table-cell">Gildir til</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((bid: Bid & { bid_request: BidRequest }) => {
                const colors = getCategoryColor(bid.bid_request?.category?.color);
                return (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium line-clamp-1">
                          {bid.bid_request?.title ?? '-'}
                        </div>
                        {bid.bid_request?.category && (
                          <Badge className={`${colors.badge} text-[10px] border px-1.5 py-0`}>
                            {bid.bid_request.category.name_is}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums font-semibold text-sm">
                      {formatIskAmount(bid.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${BID_STATUS_CLASSES[bid.status]} text-xs border`}>
                        {BID_STATUS_LABELS[bid.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {format(new Date(bid.created_at), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {bid.valid_until
                        ? format(new Date(bid.valid_until), 'dd.MM.yyyy')
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
