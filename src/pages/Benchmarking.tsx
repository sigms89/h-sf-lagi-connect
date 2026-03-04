import { Lock, Scale, TrendingDown, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { Profile } from '@/types/database';
import {
  useBenchmarkData,
  useBenchmarkFilters,
  useComparableCount,
} from '@/hooks/useBenchmarking';
import { BenchmarkFilters } from '@/components/benchmarking/BenchmarkFilters';
import { BenchmarkChart } from '@/components/benchmarking/BenchmarkChart';
import { BenchmarkTable } from '@/components/benchmarking/BenchmarkTable';

export default function Benchmarking() {
  const { data: association, isLoading: isLoadingAssoc } = useCurrentAssociation();
  const { filters, updateFilter, resetFilters } = useBenchmarkFilters();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile-benchmarking', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await db.from('profiles').select('role_type').eq('user_id', user.id).maybeSingle();
      if (error) return null;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const isSuperAdmin = profile?.role_type === 'super_admin';
  const hasPaidTier = association?.subscription_tier === 'plus' || association?.subscription_tier === 'pro';
  const isUnlocked = hasPaidTier || isSuperAdmin;

  const { data: benchmarkRows = [], isLoading: isLoadingData } = useBenchmarkData(
    association?.id,
    association?.num_units,
    filters
  );

  const { data: comparableCount, isLoading: isLoadingCount } = useComparableCount(association?.id, filters);

  if (isLoadingAssoc) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Samanburður</h1>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
          {isSuperAdmin && !hasPaidTier && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
              <Bug className="h-3 w-3" />Dev bypass
            </Badge>
          )}
        </div>
        {isUnlocked && benchmarkRows.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span>{benchmarkRows.filter((r) => r.status === 'below').length} flokkar undir meðaltali</span>
          </div>
        )}
      </div>

      {!isUnlocked ? (
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none space-y-4" aria-hidden>
            <BenchmarkFilters filters={filters} comparableCount={0} isLoadingCount={false} onUpdate={updateFilter} onReset={resetFilters} />
            <div className="rounded-lg border bg-card h-64" />
            <div className="rounded-lg border h-48" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-lg">
            <Card className="w-full max-w-sm mx-4 shadow-lg">
              <CardContent className="flex flex-col items-center text-center py-10 gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Uppfærðu í Plús</h3>
                  <p className="text-sm text-muted-foreground mt-1">Sjáðu hvernig kostnaður þíns húsfélags ber saman við sambærileg húsfélög á landsvísu.</p>
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/90">Uppfærðu í Plús til að sjá samanburð</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <BenchmarkFilters filters={filters} comparableCount={comparableCount} isLoadingCount={isLoadingCount} onUpdate={updateFilter} onReset={resetFilters} />
          {!isLoadingData && benchmarkRows.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><Scale className="h-6 w-6 text-muted-foreground" /></div>
                <div>
                  <h3 className="font-semibold">Ekki nóg gögn enn</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Þegar fleiri húsfélög eru skráð og hlaðið upp gögnum verður samanburður mögulegur.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {(isLoadingData || benchmarkRows.length > 0) && <BenchmarkChart rows={benchmarkRows} isLoading={isLoadingData} />}
          {(isLoadingData || benchmarkRows.length > 0) && <BenchmarkTable rows={benchmarkRows} isLoading={isLoadingData} associationId={association?.id} />}
        </>
      )}
    </div>
  );
}
