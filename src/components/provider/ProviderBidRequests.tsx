// ============================================================
// Húsfélagið.is — ProviderBidRequests
// List of open bid requests matching the provider's categories
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { Building2, Calendar, FileText, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BidRequest, ServiceProvider } from '@/types/database';
import { getCategoryColor } from '@/lib/categories';
import { useProviderBidRequests } from '@/hooks/useServiceProvider';
import { SubmitBidForm } from './SubmitBidForm';

interface ProviderBidRequestsProps {
  provider: ServiceProvider;
}

const TYPE_LABELS: Record<string, string> = {
  fjolbyli: 'Fjölbýlishús',
  radhus: 'Raðhús',
  parhus: 'Parhús',
};

function BidRequestCard({
  request,
  onBid,
}: {
  request: BidRequest & {
    association?: {
      num_units: number;
      building_year: number | null;
      postal_code: string | null;
      type: string;
      city: string;
    } | null;
  };
  onBid: () => void;
}) {
  const colors = getCategoryColor(request.category?.color);
  const assoc = request.association;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className={`${colors.badge} text-xs border`}>
            {request.category?.name_is}
          </Badge>
          {request.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(request.deadline), 'dd. MMM yyyy')}
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold line-clamp-2">{request.title}</h3>

        {/* Anonymised association info */}
        {assoc && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{assoc.num_units} íbúðir</span>
            </div>
            {assoc.building_year && (
              <span>Byggt {assoc.building_year}</span>
            )}
            {assoc.type && (
              <span>{TYPE_LABELS[assoc.type] ?? assoc.type}</span>
            )}
            {assoc.city && <span>{assoc.city}</span>}
          </div>
        )}

        <Button size="sm" className="w-full gap-1.5" onClick={onBid}>
          <Send className="h-3.5 w-3.5" />
          Senda tilboð
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProviderBidRequests({ provider }: ProviderBidRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<BidRequest | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: requests = [], isLoading } = useProviderBidRequests(provider);

  const categories = Array.from(
    new Map(
      requests
        .filter((r) => r.category)
        .map((r) => [r.category!.id, r.category!.name_is])
    ).entries()
  );

  const filtered = requests.filter((r) => {
    if (categoryFilter !== 'all' && r.category?.id !== categoryFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
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
        <span className="text-xs text-muted-foreground">
          {filtered.length} tilboðsbeiðnir
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">Engar opnar tilboðsbeiðnir</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Þegar húsfélög senda tilboðsbeiðnir í þínum flokkum munu þær birtast hér.
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((request) => (
          <BidRequestCard
            key={request.id}
            request={request as BidRequest & { association?: {
              num_units: number;
              building_year: number | null;
              postal_code: string | null;
              type: string;
              city: string;
            } | null }}
            onBid={() => setSelectedRequest(request)}
          />
        ))}
      </div>

      {/* Submit bid dialog */}
      {selectedRequest && (
        <SubmitBidForm
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          bidRequest={selectedRequest}
          providerId={provider.id}
        />
      )}
    </div>
  );
}
