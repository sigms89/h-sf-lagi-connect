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
  const { data: openTaskCount = 0 } = useQuery({
    queryKey: ["open-task-count", association?.id],
    queryFn: async () => {
      if (!association?.id) return 0;
      const { count } = await db
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("association_id", association.id)
        .in("status", ["open", "waiting"]);
      return count ?? 0;
    },
    enabled: !!association?.id,
  });

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Yfirlit</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {association?.name ?? "Húsfélagið þitt"}
        </p>
      </div>

      {!isLoading && !hasData ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Wallet className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div>
              <h3 className="font-semibold text-foreground">Engar hreyfingar enn</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Byrjaðu með því að hlaða inn bankayfirliti.
              </p>
            </div>
            <Button onClick={() => navigate("/peningar")} size="sm">
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
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-muted-foreground">Staða hússjóðs</p>
                  <p className="text-3xl font-semibold tracking-tight text-foreground mt-1 tabular-nums">
                    {formatIskAmount(currentBalance)}
                  </p>
                  {lastMonth && (lastMonth.income > 0 || lastMonth.expense > 0) && (
                    <p className="text-[13px] text-muted-foreground mt-3">
                      Síðasti mánuður:{" "}
                      <span className="text-teal-600 tabular-nums">+{formatIskAmount(lastMonth.income)}</span>
                      {" / "}
                      <span className="text-rose-600 tabular-nums">−{formatIskAmount(lastMonth.expense)}</span>
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Action prompts ───────────────────────────── */}
          {uncategorizedCount > 0 && (
            <Card>
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Wallet className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-foreground">
                    Þú þarft að flokka <span className="font-semibold">{uncategorizedCount}</span> hreyfingar
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/peningar")}>
                  Sjá hreyfingar
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {openTaskCount > 0 && (
            <Card>
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ClipboardList className="h-5 w-5 text-accent shrink-0" />
                  <p className="text-sm text-foreground">
                    Þú átt <span className="font-semibold">{openTaskCount}</span> opin verkefni
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/verkefni")}>
                  Sjá verkefni
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
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
