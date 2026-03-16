// ============================================================
// StatusSummary — Plain-language financial status overview
// Replaces the donut chart with human-readable status items
// ============================================================

import type { HealthScoreResult, HealthScoreFactor } from '@/hooks/useHealthScore';

interface StatusItem {
  status: 'good' | 'warning' | 'critical';
  title: string;
  description: string;
}

const statusIndicator: Record<string, { bg: string; ring: string }> = {
  good: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  warning: { bg: 'bg-amber-500', ring: 'ring-amber-500/20' },
  critical: { bg: 'bg-rose-500', ring: 'ring-rose-500/20' },
};

function factorToItem(factor: HealthScoreFactor): StatusItem {
  const titleMap: Record<string, Record<string, string>> = {
    income_expense: {
      good: 'Tekjur og gjöld í jafnvægi',
      warning: 'Gjöld nálgast tekjum',
      critical: 'Gjöld umfram tekjur',
    },
    cash_position: {
      good: 'Sjóðsstaða trygg',
      warning: 'Sjóðsstaða þröng',
      critical: 'Sjóðsstaða ógnvænleg',
    },
    payment_rate: {
      good: 'Greiðslur í skilum',
      warning: 'Sumir hafa ekki greitt',
      critical: 'Margar vanskil',
    },
    maintenance: {
      good: 'Viðhaldskostnaður eðlilegur',
      warning: 'Viðhaldskostnaður hár',
      critical: 'Viðhaldskostnaður of hár',
    },
    alerts: {
      good: 'Engar óvæntar hækkanir',
      warning: 'Óvæntar hækkanir á gjöldum',
      critical: 'Verulegar hækkanir á gjöldum',
    },
  };

  const titles = titleMap[factor.key] ?? { good: factor.label, warning: factor.label, critical: factor.label };

  return {
    status: factor.status,
    title: titles[factor.status],
    description: factor.detail,
  };
}

interface StatusSummaryProps {
  healthData: HealthScoreResult;
}

export function StatusSummary({ healthData }: StatusSummaryProps) {
  // Show all non-good items, plus good items for key factors (income_expense, cash_position)
  const items: StatusItem[] = [];
  const alwaysShow = new Set(['income_expense', 'cash_position']);

  for (const factor of healthData.factors) {
    if (factor.status !== 'good' || alwaysShow.has(factor.key)) {
      items.push(factorToItem(factor));
    }
  }

  // Sort: critical first, then warning, then good
  const order = { critical: 0, warning: 1, good: 2 };
  items.sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Ástandsyfirlit</h3>
      <div className="space-y-2">
        {items.map((item, i) => {
          const indicator = statusIndicator[item.status];
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`mt-[7px] h-2 w-2 rounded-full shrink-0 ${indicator.bg} ring-[3px] ${indicator.ring}`} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground leading-snug">{item.title}</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
