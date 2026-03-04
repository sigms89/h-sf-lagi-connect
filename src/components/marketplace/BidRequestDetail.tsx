// ============================================================
// Húsfélagið.is — BidRequestDetail
// Full detail view of a bid request with all bids
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Users,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { BidRequestStatus, BidStatus } from '@/types/database';
import { getCategoryColor, formatIskAmount } from '@/lib/categories';
import { useBidRequest, useAcceptBid, useCloseBidRequest } from '@/hooks/useMarketplace';

interface BidRequestDetailProps {
  bidRequestId: string;
  associationId: string;
  isAdmin: boolean;
  onBack: () => void;
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

export function BidRequestDetail({
  bidRequestId,
  associationId,
  isAdmin,
  onBack,
}: BidRequestDetailProps) {
  const { data: request, isLoading } = useBidRequest(bidRequestId);
  const acceptBid = useAcceptBid();
  const closeBidRequest = useCloseBidRequest();
  const [confirmBidId, setConfirmBidId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-sm text-muted-foreground py-10 text-center">
        Tilboðsbeiðni fannst ekki.
      </div>
    );
  }

  const colors = getCategoryColor(request.category?.color);
  const bids = request.bids ?? [];
  const isOpen = request.status === 'open';
  const hasAccepted = bids.some((b) => b.status === 'accepted');

  const handleAccept = async (bidId: string) => {
    await acceptBid.mutateAsync({ bidId, bidRequestId, associationId });
    setConfirmBidId(null);
  };

  const handleCancel = async () => {
    await closeBidRequest.mutateAsync({
      bidRequestId,
      status: 'cancelled',
      associationId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Til baka
      </Button>

      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${colors.badge} text-xs border`}>
                  {request.category?.name_is}
                </Badge>
                <Badge className={`${STATUS_CLASSES[request.status]} text-xs border`}>
                  {STATUS_LABELS[request.status]}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-snug">{request.title}</CardTitle>
            </div>
            {isAdmin && isOpen && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-shrink-0 text-destructive border-destructive/30 hover:bg-destructive/5">
                    Afturkalla
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Afturkalla tilboðsbeiðni?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Þetta er óafturkræft. Öll tilboð verða áfram geymd.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hætta við</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Afturkalla
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.description && (
            <p className="text-sm text-muted-foreground">{request.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Lokadagur:{' '}
                {request.deadline
                  ? format(new Date(request.deadline), 'dd. MMM yyyy')
                  : 'Enginn'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{bids.length} tilboð móttekin</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bids table */}
      <div>
        <h2 className="text-sm font-semibold mb-3">
          Móttekin tilboð ({bids.length})
        </h2>

        {bids.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Engin tilboð móttekin enn.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Fyrirtæki</TableHead>
                  <TableHead>Upphæð</TableHead>
                  <TableHead className="hidden sm:table-cell">Lýsing</TableHead>
                  <TableHead className="hidden md:table-cell">Gildistími</TableHead>
                  <TableHead>Staða</TableHead>
                  {isAdmin && isOpen && !hasAccepted && <TableHead className="w-28">Aðgerðir</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => {
                  const isAccepted = bid.status === 'accepted';
                  const showContact = isAccepted && isAdmin;

                  return (
                    <TableRow
                      key={bid.id}
                      className={isAccepted ? 'bg-green-50/50' : ''}
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {bid.provider?.company_name ?? '—'}
                          </div>
                          {/* Contact info only revealed after acceptance */}
                          {showContact && bid.provider?.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {bid.provider.phone}
                            </div>
                          )}
                          {showContact && bid.provider?.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {bid.provider.email}
                            </div>
                          )}
                          {showContact && bid.provider?.website && (
                            <a
                              href={bid.provider.website}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Vefsíða
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold text-sm">
                        {formatIskAmount(bid.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-xs">
                        <span className="line-clamp-2">{bid.description ?? '—'}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {bid.valid_until
                          ? format(new Date(bid.valid_until), 'dd. MMM yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${BID_STATUS_CLASSES[bid.status]} text-xs border`}>
                          {BID_STATUS_LABELS[bid.status]}
                        </Badge>
                      </TableCell>
                      {isAdmin && isOpen && !hasAccepted && (
                        <TableCell>
                          <AlertDialog
                            open={confirmBidId === bid.id}
                            onOpenChange={(v) => !v && setConfirmBidId(null)}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => setConfirmBidId(bid.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Samþykkja
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Samþykkja tilboð?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Þú ert að samþykkja tilboð frá{' '}
                                  <strong>{bid.provider?.company_name}</strong> að upphæð{' '}
                                  <strong>{formatIskAmount(bid.amount)}</strong>. Önnur tilboð
                                  verða sjálfkrafa hafnað.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hætta við</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleAccept(bid.id)}
                                  disabled={acceptBid.isPending}
                                >
                                  {acceptBid.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Samþykkja tilboð
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Summary when awarded */}
      {hasAccepted && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">Tilboð samþykkt</p>
              <p className="text-xs text-green-700 mt-0.5">
                Samskiptaupplýsingar þjónustuaðila eru nú sýnilegar hér að ofan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
