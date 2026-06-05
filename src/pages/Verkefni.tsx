// ============================================================
// Húsfélagið.is: Verkefni v2 — Simplified single list
// Grouped: Yfirfallið / Í dag / Þessa viku / Seinna / Lokið nýlega
// Privacy filter preserved (board-only tasks hidden from members)
// ============================================================

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";
import { isPast, isToday, isThisWeek } from "date-fns";
import TaskCard, { type TaskCardData } from "@/components/tasks/TaskCard";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

type BucketKey = "overdue" | "today" | "week" | "later" | "done";

const BUCKET_LABELS: Record<BucketKey, string> = {
  overdue: "Yfirfallið",
  today: "Í dag",
  week: "Þessa viku",
  later: "Seinna",
  done: "Lokið nýlega",
};

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export default function Verkefni() {
  const { user } = useAuth();
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;
  const [createOpen, setCreateOpen] = useState(false);

  // Membership role for privacy filter
  const { data: memberRole } = useQuery({
    queryKey: ["member-role", associationId, user?.id],
    queryFn: async () => {
      if (!associationId || !user?.id) return "member";
      const { data } = await supabase
        .from("association_members")
        .select("role")
        .eq("association_id", associationId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      return data?.role ?? "member";
    },
    enabled: !!associationId && !!user?.id,
  });
  const isBoardMember = memberRole === "admin" || memberRole === "board";

  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "verkefni", associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, assigned_to, visibility, completed_at, category")
        .eq("association_id", associationId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const assignedIds = [...new Set((data ?? []).filter((t) => t.assigned_to).map((t) => t.assigned_to!))];
      let profileMap: Record<string, string> = {};
      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", assignedIds);
        profileMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.user_id, p.full_name ?? "Úthlutað"])
        );
      }
      return (data ?? []).map((t) => ({
        ...t,
        assignee_name: t.assigned_to ? profileMap[t.assigned_to] ?? null : null,
      }));
    },
    enabled: !!associationId,
  });

  const grouped = useMemo(() => {
    const visible = rawTasks.filter((t) => t.visibility !== "board" || isBoardMember);
    const buckets: Record<BucketKey, TaskCardData[]> = {
      overdue: [], today: [], week: [], later: [], done: [],
    };

    const now = new Date();
    const twoWeeksAgo = now.getTime() - TWO_WEEKS_MS;

    visible.forEach((t) => {
      if (t.status === "done") {
        if (t.completed_at && new Date(t.completed_at).getTime() >= twoWeeksAgo) {
          buckets.done.push(t as TaskCardData);
        }
        return;
      }
      if (!t.due_date) {
        buckets.later.push(t as TaskCardData);
        return;
      }
      const due = new Date(t.due_date + "T00:00:00");
      if (isPast(due) && !isToday(due)) {
        buckets.overdue.push(t as TaskCardData);
      } else if (isToday(due)) {
        buckets.today.push(t as TaskCardData);
      } else if (isThisWeek(due, { weekStartsOn: 1 })) {
        buckets.week.push(t as TaskCardData);
      } else {
        buckets.later.push(t as TaskCardData);
      }
    });

    // Sort each bucket by due date asc (undated last)
    (Object.keys(buckets) as BucketKey[]).forEach((k) => {
      buckets[k].sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
    });

    return buckets;
  }, [rawTasks, isBoardMember]);

  const totalOpen =
    grouped.overdue.length + grouped.today.length + grouped.week.length + grouped.later.length;
  const totalAll = totalOpen + grouped.done.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Verkefni</h1>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">Verkefni</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
            {association?.name ?? "Húsfélagið þitt"}
          </h1>
          {totalAll > 0 && (
            <p className="text-[13px] text-muted-foreground mt-1">
              {totalOpen} opin · {grouped.done.length} kláruð nýlega
            </p>
          )}
        </div>
        {associationId && totalAll > 0 && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-10 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Nýtt
          </Button>
        )}
      </div>

      {totalAll === 0 ? (
        <Card>
          <CardContent className="py-10 px-6 text-center space-y-5">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Engin opin verkefni. Allt í standi.</h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Dæmi um næstu verk: laga ljós í sameign, fá tilboð í málun.
              </p>
            </div>
            <Button size="lg" onClick={() => setCreateOpen(true)} disabled={!associationId} className="w-full sm:w-auto h-12">
              <Plus className="h-4 w-4 mr-2" />
              Nýtt verkefni
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(["overdue", "today", "week", "later", "done"] as BucketKey[]).map((k) =>
            grouped[k].length > 0 ? (
              <section key={k} className="space-y-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {BUCKET_LABELS[k]}{" "}
                  <span className="text-muted-foreground/60 tabular-nums">
                    ({grouped[k].length})
                  </span>
                </h2>
                <div className="space-y-1.5">
                  {grouped[k].map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}

      {associationId && totalAll > 0 && (
        <button
          onClick={() => setCreateOpen(true)}
          aria-label="Nýtt verkefni"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center sm:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {associationId && (
        <CreateTaskModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          associationId={associationId}
        />
      )}
    </div>
  );
}
