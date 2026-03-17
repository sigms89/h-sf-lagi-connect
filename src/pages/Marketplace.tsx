// ============================================================
// Húsfélagið.is: Marketplace Page (Full Implementation)
// ============================================================

import { useState } from 'react';
import { Plus, Store, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useBidRequests, useProviders } from '@/hooks/useMarketplace';
import { BidRequestForm } from '@/components/marketplace/BidRequestForm';
import { BidRequestList } from '@/components/marketplace/BidRequestList';
import { BidRequestDetail } from '@/components/marketplace/BidRequestDetail';
import { ProviderCard } from '@/components/marketplace/ProviderCard';
import { useAuth } from '@/hooks/useAuth';

export default function Marketplace() {
  const { user } = useAuth();
  const { data: association, isLoading: isLoadingAssoc } = useCurrentAssociation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerCategoryFilter, setProviderCategoryFilter] = useState('all');

  const { data: bidRequests = [], isLoading: isLoadingRequests } = useBidRequests(
    association?.id
  );
  const { data: providers = [], isLoading: isLoadingProviders } = useProviders();

  // Collect unique categories from providers
  const providerCategories = Array.from(
    new Map(
      providers
        .flatMap((p) => p.categories ?? [])
        .map((c) => [c.id, c.name_is])
    ).entries()
  );

  // Filter providers
  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !providerSearch ||
      p.company_name.toLowerCase().includes(providerSearch.toLowerCase()) ||
      (p.description_is ?? '').toLowerCase().includes(providerSearch.toLowerCase());
    const matchesCategory =
      providerCategoryFilter === 'all' ||
      p.categories?.some((c) => c.id === providerCategoryFilter);
    return matchesSearch && matchesCategory;
  });

  if (isLoadingAssoc) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Markaðstorg</h1>
        <Badge variant="secondary" className="text-xs">Beta</Badge>
      </div>

      <Tabs defaultValue="requests">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="requests" className="gap-1.5">
              <Store className="h-3.5 w-3.5" />
              Tilboðsbeiðnir
              {bidRequests.filter((r) => r.status === 'open').length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {bidRequests.filter((r) => r.status === 'open').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Þjónustuaðilar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-0">
            {association && !selectedRequestId && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="h-4 w-4" />
                Ný tilboðsbeiðni
              </Button>
            )}
          </TabsContent>
        </div>

        {/* Bid Requests tab */}
        <TabsContent value="requests" className="mt-6">
          {selectedRequestId && association ? (
            <BidRequestDetail
              bidRequestId={selectedRequestId}
              associationId={association.id}
              isAdmin={!!association && !!user}
              onBack={() => setSelectedRequestId(null)}
            />
          ) : (
            <BidRequestList
              requests={bidRequests}
              isLoading={isLoadingRequests}
              onSelect={setSelectedRequestId}
            />
          )}
        </TabsContent>

        {/* Providers tab */}
        <TabsContent value="providers" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Leita að þjónustuaðila..."
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              className="h-8 text-sm w-48"
            />
            {providerCategories.length > 0 && (
              <Select value={providerCategoryFilter} onValueChange={setProviderCategoryFilter}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Flokkur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Allir flokkar</SelectItem>
                  {providerCategories.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span className="text-xs text-muted-foreground">
              {filteredProviders.length} þjónustuaðilar
            </span>
          </div>

          {isLoadingProviders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">Engir þjónustuaðilar skráðir</p>
              <p className="text-xs text-muted-foreground mt-1">
                Þjónustuaðilar skrá sig á gáttinni og bíða samþykktar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New bid request dialog */}
      {showNewForm && association && (
        <BidRequestForm
          open={showNewForm}
          onClose={() => setShowNewForm(false)}
          association={association}
        />
      )}
    </div>
  );
}
