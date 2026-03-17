// ============================================================
// Húsfélagið.is: Provider Profile Page
// Provider can manage their profile, portfolio, and reviews
// ============================================================

import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentProvider } from '@/hooks/useServiceProvider';
import { ProviderProfile } from '@/components/provider/ProviderProfile';
import { ProviderNotRegistered } from '@/components/provider/ProviderNotRegistered';

export default function ProviderProfilePage() {
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
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Prófíll</h1>
          <p className="text-xs text-muted-foreground">{provider.company_name}</p>
        </div>
      </div>
      <ProviderProfile provider={provider} />
    </div>
  );
}
