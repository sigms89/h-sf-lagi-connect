// ============================================================
// Húsfélagið.is — TasksWidget
// Displays open tasks with priority indicators and done button
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

const dotColor: Record<string, string> = {
  critical: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-muted-foreground/40',
};

interface TasksWidgetProps {
  associationId: string | undefined;
}

export function TasksWidget({ associationId }: TasksWidgetProps) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('association_id', associationId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).sort(
        (a: any, b: any) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
      );
    },
    enabled: !!associationId,
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', associationId] });
    },
  });

  if (!associationId) return null;

  const openCount = tasks.length;
  const displayed = tasks.slice(0, 5);

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-foreground">Verkefni</h2>
        {isLoading ? (
          <Skeleton className="h-[18px] w-6 rounded-full" />
        ) : openCount > 0 ? (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white px-1">
            {openCount}
          </span>
        ) : null}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="p-4 rounded-lg bg-card shadow-card text-center">
          <p className="text-sm text-muted-foreground">Engin opin verkefni 🎉</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayed.map((task: any) => (
            <div
              key={task.id}
              className="group flex items-center justify-between p-3.5 rounded-lg bg-card hover:bg-muted/50 shadow-card hover:shadow-card-hover transition-all duration-150"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${dotColor[task.priority] ?? dotColor.info}`}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs text-muted-foreground hover:text-emerald-600 gap-1"
                onClick={() => completeMutation.mutate(task.id)}
                disabled={completeMutation.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                Lokið
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Footer link */}
      {openCount > 5 && (
        <button className="text-xs text-accent hover:text-accent/80 font-medium inline-flex items-center gap-1 transition-colors">
          Sjá öll verkefni <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
