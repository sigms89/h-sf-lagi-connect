// ============================================================
// Húsfélagið.is — BidRequestList
// Card grid showing bid requests for the association
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, FileText, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { BidRequest, BidRequestStatus } from '@/types/database';
import { getCategoryColor } from '@/lib/categories';

interface BidRequestListProps {
  requests: BidRequest[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

const STATUS_LABELS: Record<BidRequestStatus, string> = {
  open: 'Opin',
  closed: 'Lokuð',
  awarded: 'Veitt',
  cancelled: 'Afturkölluð',
};

const STATUS_CLASSES: Record<BidRequestStatus, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-slate-100 text-slate-800 border-slate-200',
  awarded: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

function isExpiringSoon(deadline: string | null): boolean {
  if (!deadline) return false;
  const days = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 3;
}

function BidRequestCard({
  request,
  onSelect,
}: {
  request: BidRequest;
  onSelect: () => void;
}) {
  const colors = getCategoryColor(request.category?.color);
  const expiring = isExpiringSoon(request.deadline ?? null);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border hover:border-primary/30"
      onClick={onSelect}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top row: category badge + status */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={`${colors.badge} text-xs font-medium border`}>
            {request.category?.name_is ?? 'Óþekktur flokkur'}
          </Badge>
          <Badge className={`${STATUS_CLASSES[request.status]} text-xs font-medium border`}>
            {STATUS_LABELS[request.status]}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold line-clamp-2 leading-snug">
          {request.title}
        </h3>

        {/* Description preview */}
        {request.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        )}

        {/* Footer: deadline + bid count */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            {request.deadline ? (
              <span className={expiring ? 'text-orange-600 font-medium' : ''}>
                {expiring && <Clock className="h-3 w-3 inline mr-0.5" />}
                {format(new Date(request.deadline), 'dd. MMM yyyy')}
              </span>
            ) : (
              <span>Enginn lokadagur</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{request.bid_count ?? 0} tilboð</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BidRequestList({ requests, isLoading, onSelect }: BidRequestListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | BidRequestStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = Array.from(
    new Map(
      requests
        .filter((r) => r.category)
        .map((r) => [r.category!.id, r.category!.name_is])
    ).entries()
  );

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && r.category?.id !== categoryFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Staða" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Allar stöður</SelectItem>
            <SelectItem value="open">Opnar</SelectItem>
            <SelectItem value="closed">Lokaðar</SelectItem>
            <SelectItem value="awarded">Veitt</SelectItem>
            <SelectItem value="cancelled">Afturkallaðar</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="Flokkur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Allir flokkar</SelectItem>
              {categories.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <span className="text-xs text-muted-foreground ml-1">
          {filtered.length} tilboðsbeiðnir
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">Engar tilboðsbeiðnir</p>
          <p className="text-xs text-muted-foreground mt-1">
            Búðu til fyrstu tilboðsbeiðnina með því að smella á „Ný tilboðsbeiðni".
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((request) => (
          <BidRequestCard
            key={request.id}
            request={request}
            onSelect={() => onSelect(request.id)}
          />
        ))}
      </div>
    </div>
  );
}
