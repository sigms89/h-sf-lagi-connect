import type { AdminStats } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface Props { stats: AdminStats | undefined; isLoading: boolean; }

export function AdminStatsGrid({ stats, isLoading }: Props) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    );
  }
  const items = [
    { label: 'Húsfélög', value: stats.totalAssociations },
    { label: 'Samþykktir aðilar', value: stats.approvedProviders },
    { label: 'Bíða samþykktar', value: stats.pendingProviders },
    { label: 'Tilboðsbeiðnir', value: stats.totalBidRequests },
    { label: 'Opnar beiðnir', value: stats.openBidRequests },
    { label: 'Free', value: stats.freeTier },
    { label: 'Plus', value: stats.plusTier },
    { label: 'Pro', value: stats.proTier },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
