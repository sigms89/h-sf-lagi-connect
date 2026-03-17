// ============================================================
// Húsfélagið.is: AlertsWidgetNew: Compact Dashboard Widget
// Replaces the old AlertsWidget. Shows top 3 most severe
// alerts with a "Sjá allt" link to the full alerts page.
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useFinancialAlerts } from '@/hooks/useAlerts';
import type { AlertSeverity, FinancialAlert } from '@/hooks/useAlerts';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AlertsWidgetNewProps {
  associationId: string;
  maxAlerts?: number;
}

// ── Severity config (compact version) ────────────────────────────────────────

const SEVERITY_ICON: Record<AlertSeverity, React.ElementType> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  suggestion: Lightbulb,
};

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: 'text-red-600',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  suggestion: 'text-teal-500',
};

const SEVERITY_BG: Record<AlertSeverity, string> = {
  critical: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
  suggestion: 'bg-teal-50 border-teal-200',
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  suggestion: 'bg-teal-100 text-teal-700',
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'Mikilvægt',
  warning: 'Viðvörun',
  info: 'Upplýsingar',
  suggestion: 'Tillaga',
};

// ── Compact alert row ─────────────────────────────────────────────────────────

function CompactAlertRow({ alert }: { alert: FinancialAlert }) {
  const Icon = SEVERITY_ICON[alert.severity];
  const iconColor = SEVERITY_COLORS[alert.severity];
  const rowBg = SEVERITY_BG[alert.severity];
  const badgeClass = SEVERITY_BADGE[alert.severity];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${rowBg}`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
            {SEVERITY_LABEL[alert.severity]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <Skeleton className="h-4 w-4 rounded-full mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AlertsWidgetNew({
  associationId,
  maxAlerts = 3,
}: AlertsWidgetNewProps) {
  const { data: alerts = [], isLoading } = useFinancialAlerts(associationId);

  const topAlerts = alerts.slice(0, maxAlerts);
  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Viðvaranir
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isLoading && criticalCount > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs">
                {criticalCount} mikilvægt
              </Badge>
            )}
            {!isLoading && totalCount > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {totalCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <WidgetSkeleton />
            <WidgetSkeleton />
          </>
        ) : topAlerts.length === 0 ? (
          // Empty state
          <div className="flex items-center gap-3 py-3 px-1">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Ekkert athugavert</p>
              <p className="text-xs text-muted-foreground">
                Allt er í lagi — engar viðvaranir
              </p>
            </div>
          </div>
        ) : (
          <>
            {topAlerts.map((alert) => (
              <CompactAlertRow key={alert.id} alert={alert} />
            ))}

            {/* "See all" link */}
            {totalCount > maxAlerts && (
              <div className="pt-1">
                <a href="/alerts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Sjá allt ({totalCount} viðvaranir)
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Button>
                </a>
              </div>
            )}
            {totalCount <= maxAlerts && totalCount > 0 && (
              <div className="pt-1">
                <a href="/alerts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Sjá allar viðvaranir
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Button>
                </a>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
