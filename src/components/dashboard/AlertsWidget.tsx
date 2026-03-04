import { AlertTriangle, TrendingUp, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryBreakdown } from '@/types/database';
import { useCostAlerts } from '@/hooks/useCostAlerts';

interface AlertsWidgetProps {
  uncategorizedCount: number;
  categoryBreakdown: CategoryBreakdown[];
  isLoading: boolean;
  associationId?: string | null;
}

export function AlertsWidget({
  uncategorizedCount,
  categoryBreakdown,
  isLoading,
  associationId,
}: AlertsWidgetProps) {
  const { data: costAlerts = [], isLoading: alertsLoading } =
    useCostAlerts(associationId);

  const visibleCostAlerts = costAlerts.slice(0, 3);
  const hasAlerts = uncategorizedCount > 0 || visibleCostAlerts.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Viðvaranir
          {hasAlerts && (
            <Badge
              variant="secondary"
              className="ml-auto bg-amber-100 text-amber-800 text-xs"
            >
              {(uncategorizedCount > 0 ? 1 : 0) + visibleCostAlerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Uncategorized transactions alert */}
        {uncategorizedCount > 0 && (
          <Link
            to="/transactions?is_uncategorized=true"
            className="block group"
          >
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm transition-colors hover:bg-amber-100">
              <Tag className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-amber-800">
                  {uncategorizedCount} færslur án flokks
                </span>
                <p className="text-xs text-amber-600 mt-0.5 group-hover:underline">
                  Smelltu til að flokka →
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Cost increase alerts */}
        {!alertsLoading &&
          visibleCostAlerts.map((alert) => (
            <div
              key={alert.categoryId}
              className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
            >
              <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-amber-800">
                  {alert.categoryName}:{' '}
                  <span className="text-amber-700">
                    +{alert.percentChange}% hækkun
                  </span>
                </span>
                <p className="text-xs text-amber-600 mt-0.5">
                  frá fyrri 3 mánuðum
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-200 text-amber-900 text-xs shrink-0"
              >
                +{alert.percentChange}%
              </Badge>
            </div>
          ))}

        {alertsLoading && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
            Hleð viðvaranir…
          </div>
        )}

        {!alertsLoading && !hasAlerts && uncategorizedCount === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Engar viðvaranir í gangi
          </div>
        )}

        {costAlerts.length > 3 && (
          <p className="text-xs text-muted-foreground px-1">
            + {costAlerts.length - 3} fleiri hækkun
            {costAlerts.length - 3 > 1 ? 'ar' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
