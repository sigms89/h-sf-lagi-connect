import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import type { CategoryBreakdown } from '@/types/database';

interface AlertsWidgetProps {
  categoryBreakdown: CategoryBreakdown[];
  uncategorizedCount: number;
  isLoading: boolean;
}

export function AlertsWidget({ uncategorizedCount, isLoading }: AlertsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Athugasemdir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : uncategorizedCount > 0 ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Óflokkaðar færslur</p>
              <p className="text-xs text-yellow-700">
                {uncategorizedCount} færsl{uncategorizedCount === 1 ? 'a' : 'ur'} vantar flokkun
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ekkert athugavert 🎉</p>
        )}
      </CardContent>
    </Card>
  );
}
