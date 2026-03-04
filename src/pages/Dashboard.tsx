// ============================================================
// Húsfélagið.is — Dashboard Page
// KPI cards, monthly chart, category pie, recent transactions
// ============================================================

import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useTransactions, useTransactionStats } from '@/hooks/useTransactions';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { BenchmarkWidget } from '@/components/dashboard/BenchmarkWidget';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: association, isLoading: assocLoading } = useCurrentAssociation();
  const { data: stats, isLoading: statsLoading } = useTransactionStats(association?.id);
  const { data: txData, isLoading: txLoading } = useTransactions(association?.id, {
    page: 1,
    page_size: 8,
  });

  const isLoading = assocLoading || statsLoading;
  const hasData = (stats?.total_income ?? 0) > 0 || (stats?.total_expenses ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yfirlit</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {association?.name ?? 'Húsfélagið þitt'} — síðustu 12 mánuðir
          </p>
        </div>
        <Button onClick={() => navigate('/upload')} size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Hlaða upp
        </Button>
      </div>

      {/* Empty state — no data yet */}
      {!isLoading && !hasData && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">Engin gögn ennþá</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Hladdu upp bankafærslum til að sjá yfirlit yfir rekstrarkostnað húsfélagsins.
          </p>
          <Button onClick={() => navigate('/upload')} size="sm" className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            Hlaða upp færslum
          </Button>
        </div>
      )}

      {/* KPI cards */}
      {(isLoading || hasData) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BalanceCard
            label="Staða"
            amount={stats?.current_balance}
            isLoading={isLoading}
            type="balance"
            subtitle="Nýjasta staða á bankayfirliti"
          />
          <BalanceCard
            label="Tekjur (12 mán.)"
            amount={stats?.total_income}
            isLoading={isLoading}
            type="income"
          />
          <BalanceCard
            label="Gjöld (12 mán.)"
            amount={stats?.total_expenses}
            isLoading={isLoading}
            type="expense"
          />
          <BalanceCard
            label="Nettó"
            amount={stats?.net_balance}
            isLoading={isLoading}
            type="balance"
            subtitle={
              stats?.uncategorized_count
                ? `${stats.uncategorized_count} óflokkuð`
                : undefined
            }
          />
        </div>
      )}

      {/* Charts row */}
      {(isLoading || hasData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyChart data={stats?.monthly_data ?? []} isLoading={isLoading} />
          <CategoryPieChart
            data={stats?.category_breakdown ?? []}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Bottom row: Recent transactions + Alerts + Benchmark */}
      {(isLoading || hasData) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTransactions
              transactions={txData?.data ?? []}
              isLoading={txLoading}
            />
          </div>
          <div className="space-y-6">
            <AlertsWidget
              categoryBreakdown={stats?.category_breakdown ?? []}
              uncategorizedCount={stats?.uncategorized_count ?? 0}
              isLoading={isLoading}
            />
            <BenchmarkWidget numUnits={association?.num_units} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
