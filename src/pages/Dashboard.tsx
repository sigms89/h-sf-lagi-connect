// ============================================================
// Húsfélagið.is: Dashboard v5 — Simplified
// "Staðan + næsta skref" — eitt kort, ekkert KPI dashboard
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
import { Upload, ArrowRight, ClipboardList, Wallet } from "lucide-react";
import { formatIskAmount } from "@/lib/categories";
import { monthsOfOperation, vsLastMonth, nextStep, NOT_ENOUGH_DATA_MSG } from "@/lib/insights";

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

  // Provider/admin redirects preserved for backward compat (hidden from sidebar)
  if (dashProfile?.role_type === "service_provider") return <Navigate to="/provider" replace />;
  if (dashProfile?.role_type === "super_admin") return <Navigate to="/admin" replace />;

  // Open tasks (with privacy filter applied at fetch time via RLS)
  const { data: taskCounts = { open: 0, overdue: 0 } } = useQuery({
    queryKey: ["task-counts", association?.id],
    queryFn: async () => {
      if (!association?.id) return { open: 0, overdue: 0 };
      const today = new Date().toISOString().slice(0, 10);
      const [openRes, overdueRes] = await Promise.all([
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
      ]);
      return { open: openRes.count ?? 0, overdue: overdueRes.count ?? 0 };
    },
    enabled: !!association?.id,
  });
  const openTaskCount = taskCounts.open;
  const overdueTaskCount = taskCounts.overdue;

  // Last-month income/expenses
  const { data: lastMonth } = useQuery({
    queryKey: ["last-month-stats", association?.id],
    queryFn: async () => {
      if (!association?.id) return { income: 0, expense: 0 };
      const now = new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const from = firstOfLastMonth.toISOString().slice(0, 10);
      const to = firstOfThisMonth.toISOString().slice(0, 10);
      const { data } = await db
        .from("transactions")
        .select("amount, is_income")
        .eq("association_id", association.id)
        .gte("date", from)
        .lt("date", to);
      let income = 0, expense = 0;
      (data ?? []).forEach((t: { amount: number; is_income: boolean }) => {
        if (t.is_income) income += t.amount; else expense += Math.abs(t.amount);
      });
      return { income, expense };
    },
    enabled: !!association?.id,
  });

  const isLoading = assocLoading || statsLoading;
  const hasData = (stats?.total_income ?? 0) > 0 || (stats?.total_expenses ?? 0) > 0;
  const currentBalance = stats?.current_balance ?? 0;
  const uncategorizedCount = stats?.uncategorized_count ?? 0;
  const houseName = association?.name ?? "Húsfélagið þitt";
  const netLastMonth = (lastMonth?.income ?? 0) - (lastMonth?.expense ?? 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">Yfirlit</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {houseName}
        </h1>
      </div>

      {!isLoading && !hasData ? (
        <Card>
          <CardContent className="py-10 px-6 text-center space-y-5">
            <Wallet className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Velkomin/n. Þú ert formaður {houseName}.
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Byrjaðu á að hlaða inn síðasta bankayfirliti — þá sýni ég þér stöðuna.
              </p>
            </div>
            <Button onClick={() => navigate("/peningar")} size="lg" className="w-full sm:w-auto h-12">
              <Upload className="h-4 w-4 mr-2" />
              Hlaða inn bankayfirliti
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Staða hússjóðs ────────────────────────────── */}
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-12 w-56" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <>
                  <p className="text-[15px] text-foreground leading-snug">
                    <span className="font-semibold">{houseName}</span> á
                  </p>
                  <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mt-2 tabular-nums">
                    {formatIskAmount(currentBalance)}
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-1">á reikningi.</p>
                  {lastMonth && (lastMonth.income > 0 || lastMonth.expense > 0) && (
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                      {netLastMonth >= 0
                        ? <>Síðasti mánuður fór vel — <span className="text-teal-600 font-medium tabular-nums">{formatIskAmount(netLastMonth)}</span> í plús.</>
                        : <>Síðasti mánuður endaði <span className="text-rose-600 font-medium tabular-nums">{formatIskAmount(Math.abs(netLastMonth))}</span> í mínus.</>}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Action prompts ───────────────────────────── */}
          {uncategorizedCount > 0 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[15px] text-foreground leading-snug">
                    Við þurfum aðeins hjálp með{" "}
                    <span className="font-semibold tabular-nums">{uncategorizedCount}</span> hreyfingar.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/peningar")} className="w-full sm:w-auto h-11">
                  Skoða hreyfingar
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {openTaskCount > 0 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-[15px] text-foreground leading-snug">
                    Þú átt <span className="font-semibold tabular-nums">{openTaskCount}</span> opin verkefni.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/verkefni")} className="w-full sm:w-auto h-11">
                  Skoða verkefni
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
