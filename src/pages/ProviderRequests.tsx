// ============================================================
// Húsfélagið.is — Provider Bid Requests Page
// Shows open bid requests matching provider's categories/area
// ============================================================

import { Briefcase, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCurrentProvider } from '@/hooks/useServiceProvider';
import { ProviderBidRequests } from '@/components/provider/ProviderBidRequests';
import { ProviderNotRegistered } from '@/components/provider/ProviderNotRegistered';

export default function ProviderRequests() {
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
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tilboðsbeiðnir</h1>
          <p className="text-xs text-muted-foreground">Opnar beiðnir sem passa við þína þjónustu</p>
        </div>
      </div>
      <ProviderBidRequests provider={provider} />
    </div>
  );
}
