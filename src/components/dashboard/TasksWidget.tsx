// ============================================================
// Húsfélagið.is — TasksWidget (v2)
// Dashboard task section: Yfirfallin → Opin → Lokið nýlega
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { isPast, isToday, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TaskCard, { type TaskCardData } from '@/components/tasks/TaskCard';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';

interface TasksWidgetProps {
  associationId: string | undefined;
}

export function TasksWidget({ associationId }: TasksWidgetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doneOpen, setDoneOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Fetch user's role in association
  const { data: memberRole } = useQuery({
    queryKey: ['member-role', associationId, user?.id],
    queryFn: async () => {
      if (!associationId || !user?.id) return 'member';
      const { data } = await supabase
        .from('association_members')
        .select('role')
        .eq('association_id', associationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data?.role ?? 'member';
    },
    enabled: !!associationId && !!user?.id,
  });

  const isBoardMember = memberRole === 'admin' || memberRole === 'board';
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

  // Fetch tasks: open/waiting + recently done
  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: ['dashboard-tasks', associationId],
    queryFn: async () => {
      if (!associationId) return [];

      // Fetch open/waiting tasks
      const { data: openTasks, error: e1 } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, assigned_to, visibility, completed_at')
        .eq('association_id', associationId)
        .in('status', ['open', 'waiting'])
        .order('due_date', { ascending: true, nullsFirst: false });
      if (e1) throw e1;

      // Fetch recently done tasks
      const { data: doneTasks, error: e2 } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, assigned_to, visibility, completed_at')
        .eq('association_id', associationId)
        .eq('status', 'done')
        .gte('completed_at', fourteenDaysAgo)
        .order('completed_at', { ascending: false });
      if (e2) throw e2;

      const allIds = [...(openTasks ?? []), ...(doneTasks ?? [])];

      // Fetch assignee names
      const assignedIds = [...new Set(allIds.filter(t => t.assigned_to).map(t => t.assigned_to!))];
      let profileMap: Record<string, string> = {};
      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', assignedIds);
        profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.full_name ?? 'Úthlutað']));
      }

      return allIds.map(t => ({
        ...t,
        assignee_name: t.assigned_to ? (profileMap[t.assigned_to] ?? null) : null,
      }));
    },
    enabled: !!associationId,
  });

  if (!associationId) return null;

  // Filter by visibility
  const tasks = rawTasks.filter(t => t.visibility !== 'board' || isBoardMember);

  // Group tasks
  const overdue: TaskCardData[] = [];
  const open: TaskCardData[] = [];
  const recentlyDone: TaskCardData[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const t of tasks) {
    if (t.status === 'done') {
      recentlyDone.push(t);
      continue;
    }

    if (t.due_date) {
      const dueDate = new Date(t.due_date + 'T00:00:00');
      if (isPast(dueDate) && !isToday(dueDate)) {
        overdue.push(t);
        continue;
      }
    }

    open.push(t);
  }

  const openCount = overdue.length + open.length;
  const displayedOpen = open.slice(0, 5);
  const moreOpenCount = open.length - displayedOpen.length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-foreground">Verkefni</h2>
          {isLoading ? (
            <Skeleton className="h-[18px] w-6 rounded-full" />
          ) : openCount > 0 ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-medium text-white px-1">
              {openCount}
            </span>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Nýtt verkefni
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : openCount === 0 && recentlyDone.length === 0 ? (
        <div className="p-6 rounded-lg bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] text-center">
          <p className="text-sm text-muted-foreground">Engin opin verkefni 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* YFIRFALLIN — Overdue (red) */}
          {overdue.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[hsl(347,77%,50%)]">
                Yfirfallin ({overdue.length})
              </p>
              <div className="space-y-1.5">
                {overdue.map(t => <TaskCard key={t.id} task={t} />)}
              </div>
            </div>
          )}

          {/* OPIN — Open (teal) */}
          {displayedOpen.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-secondary">
                Opin ({open.length})
              </p>
              <div className="space-y-1.5">
                {displayedOpen.map(t => <TaskCard key={t.id} task={t} />)}
              </div>
              {moreOpenCount > 0 && (
                <button
                  onClick={() => navigate('/verkefni')}
                  className="text-xs text-accent hover:text-accent/80 font-medium inline-flex items-center gap-1 transition-colors mt-1"
                >
                  Sjá {moreOpenCount} fleiri opin verkefni <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* LOKIÐ NÝLEGA — Recently done (green, collapsed) */}
          {recentlyDone.length > 0 && (
            <Collapsible open={doneOpen} onOpenChange={setDoneOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-emerald-600 hover:text-emerald-700 transition-colors">
                  {doneOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  Lokið nýlega ({recentlyDone.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 mt-1.5">
                {recentlyDone.map(t => <TaskCard key={t.id} task={t} />)}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
      {associationId && (
        <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} associationId={associationId} />
      )}
    </div>
  );
}
