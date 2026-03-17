// ============================================================
// Mín Verkefni: Personal task view grouped by time
// ============================================================

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, isPast, isToday } from "date-fns";
import { ClipboardList } from "lucide-react";
import { db } from "@/integrations/supabase/db";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import TaskCard, { type TaskCardData } from "@/components/tasks/TaskCard";

export default function MinVerkefni() {
  const { user } = useAuth();
  const { data: association } = useCurrentAssociation();

  // Fetch profile for greeting
  const { data: profile } = useQuery({
    queryKey: ["profile-greeting", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  // Fetch tasks: assigned to me OR unassigned, not done
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id, association?.id],
    queryFn: async () => {
      if (!user || !association) return [];
      const { data, error } = await db
        .from("tasks")
        .select("id, title, status, due_date, assigned_to, visibility, profiles!tasks_assigned_to_fkey(full_name)")
        .eq("association_id", association.id)
        .neq("status", "done");

      if (error) throw error;

      return (data ?? []).filter(
        (t) => t.assigned_to === user.id || t.assigned_to === null
      ).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        due_date: t.due_date,
        assigned_to: t.assigned_to,
        visibility: (t as any).visibility as string,
        assignee_name: (t.profiles as any)?.full_name ?? null,
      }));
    },
    enabled: !!user && !!association,
  });

  // Split into my tasks vs unassigned
  const { myTasks, unassignedTasks } = useMemo(() => {
    if (!tasks) return { myTasks: [] as TaskCardData[], unassignedTasks: [] as TaskCardData[] };
    const my: TaskCardData[] = [];
    const unassigned: TaskCardData[] = [];
    for (const t of tasks) {
      if (t.assigned_to === null && (t as any).visibility === "all" && t.status === "open") {
        unassigned.push(t);
      } else if (t.assigned_to === user?.id) {
        my.push(t);
      }
    }
    return { myTasks: my, unassignedTasks: unassigned };
  }, [tasks, user?.id]);

  // Group my tasks by time
  const { todayGroup, weekGroup, laterGroup } = useMemo(() => {
    const today: TaskCardData[] = [];
    const week: TaskCardData[] = [];
    const later: TaskCardData[] = [];

    for (const t of myTasks) {
      if (!t.due_date) {
        later.push(t);
        continue;
      }
      const dueDate = new Date(t.due_date + "T00:00:00");
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (isToday(dueDate) || (isPast(dueDate) && differenceInDays(now, dueDate) <= 1)) {
        today.push(t);
      } else if (isPast(dueDate) || differenceInDays(dueDate, now) <= 6) {
        week.push(t);
      } else {
        later.push(t);
      }
    }

    return { todayGroup: today, weekGroup: week, laterGroup: later };
  }, [myTasks]);

  const isEmpty = myTasks.length === 0 && unassignedTasks.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      {/* Greeting */}
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {firstName ? `Góðan daginn, ${firstName} 👋` : "Góðan daginn 👋"}
      </h1>

      <h2 className="text-lg font-semibold text-foreground mt-6 mb-4">Mín verkefni</h2>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Hleð verkefnum…</p>
      )}

      {!isLoading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Ekkert á þínum borði 🎉</p>
          <p className="text-sm text-muted-foreground mt-1">Engin verkefni eru úthlutað til þín núna.</p>
        </div>
      )}

      {!isLoading && !isEmpty && (
        <>
          {/* Time-grouped sections */}
          <TaskSection title="Í dag / Í gær" tasks={todayGroup} />
          <TaskSection title="Þessi vika" tasks={weekGroup} />
          <TaskSection title="Seinna" tasks={laterGroup} />

          {/* Unassigned section */}
          {unassignedTasks.length > 0 && (
            <>
              <div className="border-t border-border my-6" />
              <TaskSection
                title="Óúthlutað: Gæti þurft á þér að halda"
                tasks={unassignedTasks}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function TaskSection({ title, tasks }: { title: string; tasks: TaskCardData[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {title} ({tasks.length})
      </h3>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}
