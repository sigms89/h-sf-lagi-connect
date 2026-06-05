// ============================================================
// Húsfélagið.is: Dashboard v6 — "Næsta skref" model
// One thing first. Numbers second. Wins visible.
// ============================================================

import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useTransactionStats } from "@/hooks/useTransactions";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/db";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import type { Profile } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { formatIskAmount } from "@/lib/categories";
import {
  monthsOfOperation,
  vsLastMonth,
  nextStepV2,
  NOT_ENOUGH_DATA_MSG,
} from "@/lib/insights";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: association, isLoading: assocLoading } = useCurrentAssociation();
  const { data: stats, isLoading: statsLoading } = useTransactionStats(association?.id);

  const { data: dashProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data } = await db.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  if (dashProfile?.role_type === "service_provider") return <Navigate to="/provider" replace />;
  if (dashProfile?.role_type === "super_admin") return <Navigate to="/admin" replace />;

  // Tasks: open, overdue, recently completed (this week)
  const { data: taskCounts = { open: 0, overdue: 0, completedThisWeek: 0 } } = useQuery({
    queryKey: ["task-counts", association?.id],
    queryFn: async () => {
      if (!association?.id) return { open: 0, overdue: 0, completedThisWeek: 0 };
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [openRes, overdueRes, doneRes] = await Promise.all([
        db
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("association_id", association.id)
          .in("status", ["open", "waiting"]),
        db
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("association_id", association.id)
          .in("status", ["open", "waiting"])
          .lt("due_date", today),
        db
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("association_id", association.id)
          .eq("status", "completed")
          .gte("updated_at", weekAgo),
      ]);
      return {
        open: openRes.count ?? 0,
        overdue: overdueRes.count ?? 0,
        completedThisWeek: doneRes.count ?? 0,
      };
    },
    enabled: !!association?.id,
  });

  const isLoading = assocLoading || statsLoading;
  const hasData = (stats?.total_income ?? 0) > 0 || (stats?.total_expenses ?? 0) > 0;
  const currentBalance = stats?.current_balance ?? 0;
  const uncategorizedCount = stats?.uncategorized_count ?? 0;
  const houseName = association?.name ?? "Húsfélagið þitt";
  const firstName = dashProfile?.full_name?.split(" ")[0] ?? null;

  // Months behind — derived from last_transaction_date
  const monthsBehind = (() => {
    const last = stats?.last_transaction_date;
    if (!last) return 0;
    const d = new Date(last);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
  })();

  const step = nextStepV2({
    hasData,
    uncategorizedCount,
    overdueTaskCount: taskCounts.overdue,
    openTaskCount: taskCounts.open,
    monthsBehind,
    month: new Date().getMonth(),
  });

  const greeting = firstName ? `Hæ ${firstName}` : "Hæ";

  // ──────────────────────────────────────────────────────────
  // Loading skeleton
  // ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Tone-based styling for hero card
  // ──────────────────────────────────────────────────────────
  const heroStyles = {
    warn: {
      ring: "ring-1 ring-amber-200",
      icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
      label: "Þetta kallar á þig",
      labelClass: "text-amber-700",
    },
    neutral: {
      ring: "ring-1 ring-teal-200",
      icon: <ArrowRight className="h-5 w-5 text-teal-700" />,
      label: "Næsta skref",
      labelClass: "text-teal-700",
    },
    calm: {
      ring: "",
      icon: <CheckCircle2 className="h-5 w-5 text-teal-600" />,
      label: "Staðan",
      labelClass: "text-zinc-500",
    },
  }[step.tone];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* ── Greeting ───────────────────────────────────────── */}
      <div>
        <p className="text-[15px] text-zinc-500">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mt-0.5">
          {houseName}
        </h1>
      </div>

      {/* ── HERO: Næsta skref ──────────────────────────────── */}
      <Card className={`border-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] ${heroStyles.ring}`}>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            {heroStyles.icon}
            <p className={`text-[11px] uppercase tracking-widest font-semibold ${heroStyles.labelClass}`}>
              {heroStyles.label}
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 leading-tight">
              {step.title}
            </h2>
            {step.subtitle && (
              <p className="text-[15px] text-zinc-600 leading-relaxed">{step.subtitle}</p>
            )}
          </div>

          {step.cta && (
            <Button
              onClick={() => navigate(step.cta!.href)}
              size="lg"
              className="w-full sm:w-auto h-12 px-6"
            >
              {step.cta.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Recent wins (dopamine recap) ───────────────────── */}
      {taskCounts.completedThisWeek > 0 && (
        <div className="flex items-center gap-2 px-1 text-sm text-zinc-600">
          <Sparkles className="h-4 w-4 text-teal-600" />
          <span>
            <span className="font-semibold text-zinc-900">
              {taskCounts.completedThisWeek}
            </span>{" "}
            {taskCounts.completedThisWeek === 1 ? "verkefni klárað" : "verkefni kláruð"} í þessari viku.
          </span>
        </div>
      )}

      {/* ── Stöðukort (quieter) ────────────────────────────── */}
      {hasData && (
        <Card className="border-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-6">
            <p className="text-[11px] uppercase tracking-widest font-medium text-zinc-500 mb-3">
              Hússjóður
            </p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {formatIskAmount(currentBalance)}
            </p>
            {(() => {
              const runway = monthsOfOperation(currentBalance, stats?.monthly_data ?? []);
              const vsLast = vsLastMonth(stats?.monthly_data ?? []);
              const lines = [runway, vsLast].filter(Boolean) as string[];
              if (lines.length === 0) {
                return (
                  <p className="text-sm text-zinc-500 mt-3 leading-relaxed">
                    {NOT_ENOUGH_DATA_MSG}
                  </p>
                );
              }
              return (
                <div className="mt-3 space-y-1">
                  {lines.map((l, i) => (
                    <p key={i} className="text-sm text-zinc-600 leading-relaxed">
                      {l}
                    </p>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
