// ============================================================
// Húsfélagið.is — Provider Dashboard Page (Overview only)
// Protected: only for users with a service_provider record
// ============================================================

import { Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCurrentProvider } from '@/hooks/useServiceProvider';
import { ProviderDashboardOverview } from '@/components/provider/ProviderDashboardOverview';
import { ProviderNotRegistered } from '@/components/provider/ProviderNotRegistered';

export default function ProviderDashboard() {
  const { data: provider, isLoading } = useCurrentProvider();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!provider) return <ProviderNotRegistered />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{provider.company_name}</h1>
          <p className="text-xs text-muted-foreground">Yfirlit þjónustuaðila</p>
        </div>
        {!provider.is_approved && (
          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
            Bíður samþykktar
          </Badge>
        )}
        {provider.is_approved && (
          <Badge className="text-xs bg-teal-100 text-teal-800 border-teal-200">
            Samþykkt
          </Badge>
        )}
      </div>

      <ProviderDashboardOverview provider={provider} />
    </div>
  );
}
