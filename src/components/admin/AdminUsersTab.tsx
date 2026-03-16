// ============================================================
// Húsfélagið.is — AdminUsersTab (NEW)
// Global view of ALL users across all associations
// Table: full_name, association, role, joined_at, is_active
// Search by name, pagination 25/page
// ============================================================

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { Search, Users, ChevronLeft, ChevronRight, UserX } from 'lucide-react';
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
import { useAllUsers } from '@/hooks/useAdminExtended';

// ============================================================
// Constants
// ============================================================

const PAGE_SIZE = 25;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Stjórnandi',
  board: 'Stjórnarmeðlimur',
  member: 'Meðlimur',
};

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  board: 'secondary',
  member: 'outline',
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

// ============================================================
// AdminUsersTab
// ============================================================

export function AdminUsersTab() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAllUsers(search || undefined, page, PAGE_SIZE);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Notendur</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {data
                ? `${data.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} notendur samtals`
                : 'Hleður...'}
            </CardDescription>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Leita að nafni..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleSearch}>
            Leita
          </Button>
          {search && (
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleClear}>
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
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {search ? 'Engir notendur fundust fyrir þessa leit' : 'Engir notendur skráðir'}
            </p>
            {search && (
              <Button size="sm" variant="ghost" className="text-xs" onClick={handleClear}>
                Hreinsa leit
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nafn</TableHead>
                <TableHead className="text-xs">Húsfélag</TableHead>
                <TableHead className="text-xs w-36">Hlutverk</TableHead>
                <TableHead className="text-xs w-32">Skráður</TableHead>
                <TableHead className="text-xs w-20">Virkur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-xs font-medium">
                    {user.profile?.full_name ?? (
                      <span className="text-muted-foreground italic">Nafnlaust</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.association?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ROLE_VARIANTS[user.role] ?? 'outline'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(user.joined_at)}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        user.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.is_active ? 'bg-green-500' : 'bg-muted-foreground'
                        }`}
                      />
                      {user.is_active ? 'Virkur' : 'Óvirkur'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              Síða {page} af {totalPages} · {data?.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} notendur
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
