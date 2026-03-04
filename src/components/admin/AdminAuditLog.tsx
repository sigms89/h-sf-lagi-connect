// ============================================================
// Húsfélagið.is — AdminAuditLog (NEW)
// Paginated audit log viewer for super admin panel
// Table: timestamp, user (resolved via profiles), action, entity_type, entity_id, metadata
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { Search, Filter, ChevronLeft, ChevronRight, FileX } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuditLog, type AuditLogEntry, type AuditLogFilters } from '@/hooks/useAdminExtended';

// ============================================================
// Constants
// ============================================================

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  create: 'Stofnað',
  update: 'Uppfært',
  delete: 'Eytt',
  login: 'Innskráning',
  logout: 'Útskráning',
  approve: 'Samþykkt',
  reject: 'Hafnað',
  invite: 'Boðið',
  upload: 'Hlaðið upp',
};

const ACTION_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  approve: 'default',
  reject: 'destructive',
};

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'dd. MMM yyyy HH:mm', { locale: is });
  } catch {
    return iso;
  }
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function metadataSummary(meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return '—';
  const keys = Object.keys(meta);
  if (keys.length <= 2) {
    return keys.map((k) => `${k}: ${String(meta[k])}`).join(', ');
  }
  return `${keys.length} reiti`;
}

// ============================================================
// MetadataDialog
// ============================================================

interface MetadataDialogProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

function MetadataDialog({ entry, onClose }: MetadataDialogProps) {
  if (!entry) return null;

  return (
    <Dialog open={!!entry} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Lýsigögn aðgerðar</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-xs">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 flex-shrink-0">Aðgerð:</span>
            <span className="font-medium">{actionLabel(entry.action)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 flex-shrink-0">Tegund:</span>
            <span className="font-medium">{entry.entity_type ?? '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 flex-shrink-0">Eininga-ID:</span>
            <span className="font-mono text-[11px] break-all">{entry.entity_id ?? '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 flex-shrink-0">Tími:</span>
            <span>{formatDate(entry.created_at)}</span>
          </div>
          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
            <div className="mt-3">
              <p className="text-muted-foreground mb-1.5">Lýsigögn:</p>
              <pre className="bg-muted rounded-md p-3 text-[11px] overflow-auto max-h-64 whitespace-pre-wrap break-all">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// AdminAuditLog
// ============================================================

export function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const activeFilters: AuditLogFilters = {
    action: actionFilter !== 'all' ? actionFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const { data, isLoading } = useAuditLog(page, PAGE_SIZE, activeFilters);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  function handleFilterApply() {
    setPage(1);
    setFilters(activeFilters);
  }

  function handleFilterReset() {
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setFilters({});
  }

  return (
    <>
      <MetadataDialog entry={selectedEntry} onClose={() => setSelectedEntry(null)} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Aðgerðaskrá</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {data ? `${data.count.toLocaleString('is-IS')} færslur samtals` : 'Hleður...'}
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Allar aðgerðir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Allar aðgerðir</SelectItem>
                <SelectItem value="create">Stofnað</SelectItem>
                <SelectItem value="update">Uppfært</SelectItem>
                <SelectItem value="delete">Eytt</SelectItem>
                <SelectItem value="login">Innskráning</SelectItem>
                <SelectItem value="logout">Útskráning</SelectItem>
                <SelectItem value="approve">Samþykkt</SelectItem>
                <SelectItem value="reject">Hafnað</SelectItem>
                <SelectItem value="invite">Boðið</SelectItem>
                <SelectItem value="upload">Hlaðið upp</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Frá"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <Input
              type="date"
              placeholder="Til"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs w-36"
            />

            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleFilterApply}>
              <Filter className="h-3 w-3 mr-1" />
              Sía
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleFilterReset}>
              Hreinsa
            </Button>
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
              <p className="text-sm text-muted-foreground">Engar aðgerðarfærslur fundust</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-40">Dagsetning</TableHead>
                  <TableHead className="text-xs w-36">Notandi</TableHead>
                  <TableHead className="text-xs w-28">Aðgerð</TableHead>
                  <TableHead className="text-xs w-32">Tegund</TableHead>
                  <TableHead className="text-xs">Eininga-ID</TableHead>
                  <TableHead className="text-xs">Lýsigögn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <TableCell className="text-xs tabular-nums">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {entry.profile?.full_name ?? (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {entry.user_id ? entry.user_id.slice(0, 8) + '…' : '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ACTION_VARIANTS[entry.action] ?? 'outline'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {actionLabel(entry.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.entity_type ?? '—'}
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground max-w-[120px] truncate">
                      {entry.entity_id ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {metadataSummary(entry.metadata)}
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
                Síða {page} af {totalPages}
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
    </>
  );
}
