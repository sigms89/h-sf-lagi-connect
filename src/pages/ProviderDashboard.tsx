// ============================================================
// Húsfélagið.is — Provider Dashboard Page
// Protected: only for users with a service_provider record
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, List, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCurrentProvider } from '@/hooks/useServiceProvider';
import { ProviderDashboardOverview } from '@/components/provider/ProviderDashboardOverview';
import { ProviderBidRequests } from '@/components/provider/ProviderBidRequests';
import { MyBids } from '@/components/provider/MyBids';
import { ProviderProfile } from '@/components/provider/ProviderProfile';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { data: provider, isLoading } = useCurrentProvider();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Not a provider — redirect to registration
  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Þjónustuaðilasvæðið</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Þú ert ekki skráður sem þjónustuaðili. Skráðu þig til að geta tekið þátt í
            tilboðsferlum og boðið þjónustu þína húsfélögum.
          </p>
        </div>
        <Button onClick={() => navigate('/provider/register')}>
          Skrá fyrirtæki mitt
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{provider.company_name}</h1>
          <p className="text-xs text-muted-foreground">Þjónustuaðilasvæðið</p>
        </div>
        {!provider.is_approved && (
          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
            Bíður samþykktar
          </Badge>
        )}
        {provider.is_approved && (
          <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
            Samþykkt
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Yfirlit</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Tilboðsbeiðnir
          </TabsTrigger>
          <TabsTrigger value="bids" className="gap-1.5">
            <List className="h-3.5 w-3.5" />
            Mín tilboð
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Prófíll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProviderDashboardOverview provider={provider} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <ProviderBidRequests provider={provider} />
        </TabsContent>

        <TabsContent value="bids" className="mt-6">
          <MyBids providerId={provider.id} />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProviderProfile provider={provider} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
