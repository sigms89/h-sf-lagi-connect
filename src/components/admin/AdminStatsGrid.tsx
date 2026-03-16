// ============================================================
// Húsfélagið.is — AdminStatsGrid (REPLACE)
// KPI cards for the super admin dashboard
// Updated: real activeUsers, MRR card, Churn placeholder (7 cards total)
// ============================================================

import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Users,
  TrendingDown,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminStats } from '@/hooks/useAdmin';

// ============================================================
// StatCard sub-component
// ============================================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
  bgClass?: string;
}

function StatCard({ icon: Icon, label, value, sub, iconClass, bgClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass ?? 'bg-primary/10'}`}>
            <Icon className={`h-[18px] w-[18px] ${iconClass ?? 'text-primary'}`} />
          </div>
          <div className="text-right min-w-0">
            <div className="text-2xl font-bold tabular-nums leading-tight">{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatISK(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M kr.`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)} þ.kr.`;
  }
  return `${Math.abs(Math.round(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} kr.`;
}

// ============================================================
// AdminStatsGrid
// ============================================================

interface AdminStatsGridProps {
  stats: AdminStats | undefined;
  isLoading: boolean;
}

export function AdminStatsGrid({ stats, isLoading }: AdminStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const tierBreakdown = `${stats.freeTier} frí / ${stats.plusTier} plus / ${stats.proTier} pro`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {/* 1. Húsfélög */}
      <StatCard
        icon={Building2}
        label="Húsfélög"
        value={stats.totalAssociations}
        sub={tierBreakdown}
        bgClass="bg-blue-50"
        iconClass="text-blue-600"
      />

      {/* 2. Virkir notendur (real count from association_members) */}
      <StatCard
        icon={Users}
        label="Virkir notendur"
        value={stats.activeUsers}
        bgClass="bg-indigo-50"
        iconClass="text-indigo-600"
      />

      {/* 3. MRR */}
      <StatCard
        icon={CreditCard}
        label="MRR"
        value={formatISK(stats.mrr)}
        sub={`${stats.plusTier} plus · ${stats.proTier} pro`}
        bgClass="bg-emerald-50"
        iconClass="text-emerald-600"
      />

      {/* 4. Churn (placeholder) */}
      <StatCard
        icon={TrendingDown}
        label="Churn"
        value="—"
        sub="Kemur bráðlega"
        bgClass="bg-muted"
        iconClass="text-muted-foreground"
      />

      {/* 5. Þjónustuaðilar */}
      <StatCard
        icon={CheckCircle2}
        label="Þjónustuaðilar"
        value={stats.approvedProviders}
        sub={`${stats.pendingProviders} í bið`}
        bgClass="bg-green-50"
        iconClass="text-green-600"
      />

      {/* 6. Bíður samþykktar */}
      <StatCard
        icon={Clock}
        label="Bíður samþykktar"
        value={stats.pendingProviders}
        bgClass={stats.pendingProviders > 0 ? 'bg-orange-50' : 'bg-muted'}
        iconClass={stats.pendingProviders > 0 ? 'text-orange-600' : 'text-muted-foreground'}
      />

      {/* 7. Tilboðsferlar */}
      <StatCard
        icon={FileText}
        label="Tilboðsferlar"
        value={stats.totalBidRequests}
        sub={`${stats.openBidRequests} opin`}
        bgClass="bg-teal-50"
        iconClass="text-teal-600"
      />
    </div>
  );
}
