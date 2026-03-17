// ============================================================
// Húsfélagið.is — AssociationTable
// Full table of all associations for the admin panel
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { Building2, MoreHorizontal, Search } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { Association, SubscriptionTier } from '@/types/database';
import { useAllAssociations, useUpdateAssociationTier } from '@/hooks/useAdmin';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Frí',
  plus: 'Plus',
  pro: 'Pro',
};

const TIER_CLASSES: Record<SubscriptionTier, string> = {
  free: 'bg-slate-100 text-slate-700 border-slate-200',
  plus: 'bg-blue-100 text-blue-700 border-blue-200',
  pro: 'bg-purple-100 text-purple-700 border-purple-200',
};

const TYPE_LABELS: Record<string, string> = {
  fjolbyli: 'Fjölbýlishús',
  radhus: 'Raðhús',
  parhus: 'Parhús',
};

export function AssociationTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useAllAssociations(debouncedSearch, page);
  const updateTier = useUpdateAssociationTier();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Simple debounce
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const PAGE_SIZE = 25;
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Leita að húsfélagi..."
            className="pl-9 h-8 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {data?.count ?? 0} húsfélög
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nafn</TableHead>
              <TableHead className="hidden sm:table-cell">Heimilisfang</TableHead>
              <TableHead>Íbúðir</TableHead>
              <TableHead className="hidden md:table-cell">Tegund</TableHead>
              <TableHead>Áskrift</TableHead>
              <TableHead className="hidden lg:table-cell">Skráð</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Engin húsfélög fundust
                </TableCell>
              </TableRow>
            ) : (
              (data?.data ?? []).map((assoc: Association) => (
                <TableRow key={assoc.id}>
                  <TableCell className="font-medium text-sm">{assoc.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {assoc.address ?? '-'}
                    {assoc.postal_code && `, ${assoc.postal_code}`}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{assoc.num_units}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {TYPE_LABELS[assoc.type] ?? assoc.type}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${TIER_CLASSES[assoc.subscription_tier]} text-xs border font-medium`}
                    >
                      {TIER_LABELS[assoc.subscription_tier]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {format(new Date(assoc.created_at), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs">Breyta áskrift</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(['free', 'plus', 'pro'] as SubscriptionTier[]).map((tier) => (
                          <DropdownMenuItem
                            key={tier}
                            onClick={() =>
                              updateTier.mutate({
                                associationId: assoc.id,
                                tier,
                              })
                            }
                            disabled={assoc.subscription_tier === tier}
                            className="text-xs"
                          >
                            Breyta í {TIER_LABELS[tier]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Síða {page} af {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Fyrri
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Næsta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
