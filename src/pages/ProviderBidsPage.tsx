// ============================================================
// Húsfélagið.is — Provider My Bids Page
// Shows all bids submitted by the current provider
// ============================================================

import { List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentProvider } from '@/hooks/useServiceProvider';
import { MyBids } from '@/components/provider/MyBids';
import { ProviderNotRegistered } from '@/components/provider/ProviderNotRegistered';

export default function ProviderBidsPage() {
  const { data: provider, isLoading } = useCurrentProvider();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!provider) return <ProviderNotRegistered />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <List className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mín tilboð</h1>
          <p className="text-xs text-muted-foreground">Öll tilboð sem þú hefur sent</p>
        </div>
      </div>
      <MyBids providerId={provider.id} />
    </div>
  );
}
