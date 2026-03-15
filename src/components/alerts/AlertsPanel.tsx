// ============================================================
// Húsfélagið.is — AlertsPanel: Full Alerts Panel Component
// Replaces the old AlertsWidget with a rich, filterable
// alerts panel powered by useFinancialAlerts.
// ============================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useFinancialAlerts } from '@/hooks/useAlerts';
import type { AlertSeverity, FinancialAlert } from '@/hooks/useAlerts';
import { formatIskAmount } from '@/lib/categories';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AlertsPanelProps {
  associationId: string;
}

// ── Severity config ───────────────────────────────────────────────────────────

interface SeverityConfig {
  label: string;
  cardClass: string;
  badgeClass: string;
  Icon: React.ElementType;
  dotClass: string;
}

const SEVERITY_CONFIG: Record<AlertSeverity, SeverityConfig> = {
  critical: {
    label: 'Mikilvægt',
    cardClass: 'bg-red-50 border-red-200',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    Icon: AlertCircle,
    dotClass: 'bg-red-500',
  },
  warning: {
    label: 'Viðvörun',
    cardClass: 'bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    Icon: AlertTriangle,
    dotClass: 'bg-amber-500',
  },
  info: {
    label: 'Upplýsingar',
    cardClass: 'bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    Icon: Info,
    dotClass: 'bg-blue-500',
  },
  suggestion: {
    label: 'Tillaga',
    cardClass: 'bg-teal-50 border-teal-200',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
    Icon: Lightbulb,
    dotClass: 'bg-teal-500',
  },
};

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = 'all' | AlertSeverity;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Allt' },
  { key: 'critical', label: 'Mikilvægt' },
  { key: 'warning', label: 'Viðvaranir' },
  { key: 'suggestion', label: 'Tillögur' },
];

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: FinancialAlert }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const { Icon, cardClass, badgeClass, dotClass } = config;

  const hasMetric = alert.metric !== undefined;
  const changeAbs = hasMetric ? Math.abs(alert.metric!.change) : 0;
  const isPositiveChange = hasMetric ? alert.metric!.change > 0 : false;

  return (
    <div className={`rounded-lg border p-4 ${cardClass}`}>
      <div className="flex items-start gap-3">
        {/* Severity dot + icon */}
        <div className="flex items-center justify-center mt-0.5 flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${dotClass} mr-2`} />
          <Icon className="h-4 w-4 opacity-70" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold leading-tight">{alert.title}</p>
            <Badge
              variant="outline"
              className={`text-xs flex-shrink-0 ${badgeClass}`}
            >
              {config.label}
            </Badge>
          </div>

          <p className="text-sm opacity-80 mb-2">{alert.description}</p>

          {/* Metric row */}
          {hasMetric && (
            <div className="flex items-center gap-2 text-xs font-medium mb-2">
              {isPositiveChange ? (
                <TrendingUp className="h-3.5 w-3.5 text-rose-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-teal-600" />
              )}
              <span>
                {isPositiveChange ? '+' : '-'}
                {changeAbs.toFixed(1)}%
              </span>
              <span className="opacity-60">
                ({formatIskAmount(alert.metric!.previous)} →{' '}
                {formatIskAmount(alert.metric!.current)})
              </span>
            </div>
          )}

          {/* Action button */}
          {alert.actionLabel && alert.actionHref && (
            <a href={alert.actionHref}>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs -ml-2">
                {alert.actionLabel}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function AlertSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 ml-auto" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AlertsPanel({ associationId }: AlertsPanelProps) {
  const { data: alerts = [], isLoading } = useFinancialAlerts(associationId);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredAlerts =
    activeFilter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === activeFilter);

  // Count per severity
  const counts: Record<AlertSeverity, number> = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
    suggestion: alerts.filter((a) => a.severity === 'suggestion').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Viðvaranir og tillögur
          </CardTitle>
          {!isLoading && alerts.length > 0 && (
            <Badge variant="secondary" className="font-mono">
              {alerts.length}
            </Badge>
          )}
        </div>

        {/* Filter tabs */}
        {!isLoading && alerts.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {FILTER_TABS.map(({ key, label }) => {
              const count =
                key === 'all'
                  ? alerts.length
                  : counts[key as AlertSeverity] ?? 0;
              if (key !== 'all' && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`
                    inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                    transition-colors
                    ${
                      activeFilter === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }
                  `}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={`
                        rounded-full px-1.5 py-0.5 text-[10px] font-bold
                        ${activeFilter === key ? 'bg-primary-foreground/20' : 'bg-background/60'}
                      `}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <AlertSkeleton />
            <AlertSkeleton />
            <AlertSkeleton />
          </>
        ) : filteredAlerts.length === 0 && activeFilter === 'all' ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-1" />
            <p className="text-sm font-medium text-foreground">Ekkert athugavert</p>
            <p className="text-xs text-muted-foreground">
              Engar viðvaranir eða tillögur eru til staðar
            </p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Engar viðvaranir í þessum flokki
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
