// ============================================================
// Húsfélagið.is — ProviderDashboardOverview
// Overview stats for the provider dashboard
// ============================================================

import { CheckCircle2, Clock, FileText, TrendingUp, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ServiceProvider } from '@/types/database';
import { useProviderStats, useProviderBidRequests } from '@/hooks/useServiceProvider';

interface ProviderDashboardProps {
  provider: ServiceProvider;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  iconBg?: string;
  iconColor?: string;
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg ?? 'bg-primary/10'}`}>
            <Icon className={`h-[18px] w-[18px] ${iconColor ?? 'text-primary'}`} />
          </div>
          <span className="text-2xl font-bold tabular-nums">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

export function ProviderDashboardOverview({ provider }: ProviderDashboardProps) {
  const { data: stats, isLoading: isLoadingStats } = useProviderStats(provider);
  const { data: matchingRequests = [], isLoading: isLoadingRequests } = useProviderBidRequests(provider);

  if (isLoadingStats || isLoadingRequests) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Opin tilboð í mínum flokkum"
          value={matchingRequests.length}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Clock}
          label="Mín tilboð (í bið)"
          value={stats?.pendingBids ?? 0}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Samþykkt tilboð"
          value={stats?.acceptedBids ?? 0}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Hlutfall samþykktra"
          value={`${stats?.acceptanceRate ?? 0}%`}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
      </div>

      {/* Approval status */}
      {!provider.is_approved && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">Bíður samþykktar</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Skráning þín er í yfirferð hjá kerfisstjóra. Þetta tekur yfirleitt 1–2 virka daga.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent open requests */}
      {matchingRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Nýjustu opnar tilboðsbeiðnir í mínum flokkum
          </h3>
          <div className="space-y-2">
            {matchingRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                <span className="font-medium line-clamp-1 flex-1 mr-4">{req.title}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {req.deadline
                    ? `Lokadagur: ${new Date(req.deadline).toLocaleDateString('is-IS')}`
                    : 'Enginn lokadagur'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
