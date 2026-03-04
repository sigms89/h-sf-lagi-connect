// ============================================================
// Húsfélagið.is — Analytics Page (placeholder)
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useTransactionStats } from '@/hooks/useTransactions';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';

export default function Analytics() {
  const { data: association } = useCurrentAssociation();
  const { data: stats, isLoading } = useTransactionStats(association?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Greining</h1>
        <Badge variant="secondary">Beta</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={stats?.monthly_data ?? []} isLoading={isLoading} />
        <CategoryPieChart data={stats?.category_breakdown ?? []} isLoading={isLoading} />
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Ítarleg greining í vinnslu</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Kostnaðarþróun, spár, og sjálfvirk viðvörunarkerfi eru í vinnslu.
              Væntanlegt í næstu útgáfu.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Fáanlegt í Plus og Pro áskrift
          </div>
          <Button variant="outline" size="sm" disabled>
            Tilkynna mér þegar tilbúið
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
