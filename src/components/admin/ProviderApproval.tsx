// ============================================================
// Húsfélagið.is — ProviderApproval
// Admin panel: list and approve/reject service providers
// ============================================================

import { format } from 'date-fns';
import { Building2, CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllProviders, useApproveProvider, useRejectProvider } from '@/hooks/useAdmin';
import { getCategoryColor } from '@/lib/categories';
import type { ServiceProvider } from '@/types/database';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface ProviderRowProps {
  provider: ServiceProvider;
  isPending: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

function ProviderRow({ provider, isPending, onApprove, onReject }: ProviderRowProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 rounded-lg border flex-shrink-0">
            <AvatarImage src={provider.logo_url ?? undefined} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(provider.company_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{provider.company_name}</p>
                {provider.kennitala && (
                  <p className="text-xs text-muted-foreground">Kt. {provider.kennitala}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">
                Skráð {format(new Date(provider.created_at), 'dd.MM.yyyy')}
              </p>
            </div>

            {provider.description_is && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {provider.description_is}
              </p>
            )}

            {/* Categories */}
            {provider.categories && provider.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {provider.categories.map((cat) => {
                  const colors = getCategoryColor(cat.color);
                  return (
                    <Badge key={cat.id} className={`${colors.badge} text-[10px] border px-1.5 py-0`}>
                      {cat.name_is}
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Service area */}
            {provider.service_area && provider.service_area.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                {provider.service_area.slice(0, 3).join(', ')}
                {provider.service_area.length > 3 &&
                  ` +${provider.service_area.length - 3}`}
              </div>
            )}

            {/* Actions for pending */}
            {isPending && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove?.(provider.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Samþykkja
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => onReject?.(provider.id)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Hafna
                </Button>
              </div>
            )}

            {/* Approved badge */}
            {!isPending && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                Samþykkt
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderApproval() {
  const { data: pendingProviders = [], isLoading: isLoadingPending } = useAllProviders('pending');
  const { data: approvedProviders = [], isLoading: isLoadingApproved } = useAllProviders('approved');
  const approveProvider = useApproveProvider();
  const rejectProvider = useRejectProvider();

  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending" className="gap-1.5">
          Bíður samþykktar
          {pendingProviders.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {pendingProviders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="approved">Samþykktir</TabsTrigger>
      </TabsList>

      {/* Pending */}
      <TabsContent value="pending" className="mt-4 space-y-3">
        {isLoadingPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : pendingProviders.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Engir þjónustuaðilar í bið
            </p>
          </div>
        ) : (
          pendingProviders.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              isPending={true}
              onApprove={(id) => approveProvider.mutate(id)}
              onReject={(id) => rejectProvider.mutate(id)}
            />
          ))
        )}
      </TabsContent>

      {/* Approved */}
      <TabsContent value="approved" className="mt-4 space-y-3">
        {isLoadingApproved ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : approvedProviders.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Engir samþykktir þjónustuaðilar enn.
          </div>
        ) : (
          approvedProviders.map((provider) => (
            <ProviderRow key={provider.id} provider={provider} isPending={false} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
