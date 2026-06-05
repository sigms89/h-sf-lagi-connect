// ============================================================
// useTask: Single task fetch + mutations (assign, complete)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { celebrate } from '@/lib/celebrate';

export interface TaskWithProfiles {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  association_id: string;
  visibility: string;
  current_stage: number | null;
  total_stages: number | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  assignee_name: string | null;
  creator_name: string | null;
}

export const TASK_KEYS = {
  all: ['tasks'] as const,
  byId: (id: string) => ['tasks', id] as const,
};

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: TASK_KEYS.byId(taskId ?? ''),
    queryFn: async (): Promise<TaskWithProfiles | null> => {
      if (!taskId) return null;

      const { data, error } = await db
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch assignee profile
      let assigneeName: string | null = null;
      if (data.assigned_to) {
        const { data: assignee } = await db
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.assigned_to)
          .maybeSingle();
        assigneeName = assignee?.full_name ?? null;
      }

      // Fetch creator profile
      let creatorName: string | null = null;
      if (data.created_by) {
        const { data: creator } = await db
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.created_by)
          .maybeSingle();
        creatorName = creator?.full_name ?? null;
      }

      return {
        ...data,
        assignee_name: assigneeName,
        creator_name: creatorName,
      } as TaskWithProfiles;
    },
    enabled: !!taskId,
  });
}

export function useCompleteTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await db
        .from('tasks')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;

      // Fetch current user's name for system comment
      if (user?.id) {
        const { data: profile } = await db
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        const name = profile?.full_name ?? 'Notandi';

        await db.from('task_comments').insert({
          task_id: taskId,
          user_id: user.id,
          content: `${name} kláraði verkefni`,
          is_system: true,
        });
      }
    },
    // Optimistic: instantly mark task done in cache so UI feels snappy
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard-tasks'] });
      await queryClient.cancelQueries({ queryKey: TASK_KEYS.byId(taskId) });

      const prevDashboard = queryClient.getQueriesData({ queryKey: ['dashboard-tasks'] });
      const prevTask = queryClient.getQueryData(TASK_KEYS.byId(taskId));
      const prevCounts = queryClient.getQueriesData({ queryKey: ['task-counts'] });

      // Mark in dashboard lists
      queryClient.setQueriesData<any>({ queryKey: ['dashboard-tasks'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) =>
          t?.id === taskId ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t,
        );
      });
      // Decrement open count locally
      queryClient.setQueriesData<any>({ queryKey: ['task-counts'] }, (old: any) => {
        if (!old || typeof old.open !== 'number') return old;
        return { ...old, open: Math.max(0, old.open - 1) };
      });
      // Update single task cache
      queryClient.setQueryData<any>(TASK_KEYS.byId(taskId), (old: any) =>
        old ? { ...old, status: 'done', completed_at: new Date().toISOString() } : old,
      );

      return { prevDashboard, prevTask, prevCounts };
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });

      // Peak-end: lítill „dopamine receipt" — counts already decremented optimistically
      const cache = queryClient.getQueriesData<{ open: number }>({ queryKey: ['task-counts'] });
      const remaining = cache?.[0]?.[1]?.open;
      const subtitle =
        typeof remaining === 'number'
          ? remaining <= 0
            ? 'Þú ert búin/n með öll opin verkefni.'
            : `${remaining} ${remaining === 1 ? 'verkefni' : 'verkefni'} eftir.`
          : undefined;
      celebrate({
        title: 'Vel gert',
        subtitle,
        intensity: remaining !== undefined && remaining <= 0 ? 'shower' : 'burst',
      });
    },
    onError: (error: Error, _taskId, ctx) => {
      // Rollback optimistic changes
      if (ctx?.prevDashboard) {
        ctx.prevDashboard.forEach(([key, data]: any) => queryClient.setQueryData(key, data));
      }
      if (ctx?.prevCounts) {
        ctx.prevCounts.forEach(([key, data]: any) => queryClient.setQueryData(key, data));
      }
      if (ctx?.prevTask !== undefined) {
        queryClient.setQueryData(TASK_KEYS.byId(_taskId), ctx.prevTask);
      }
      toast.error(`Villa: ${error.message}`);
    },
  });
}

export function useAssignTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId?: string }) => {
      const assignTo = userId ?? user?.id;
      if (!assignTo) throw new Error('Notandi ekki skráður inn');
      if (!user?.id) throw new Error('Notandi ekki skráður inn');

      // Update the task
      const { error } = await db
        .from('tasks')
        .update({ assigned_to: assignTo })
        .eq('id', taskId);
      if (error) throw error;

      // Fetch current user profile name
      const { data: currentProfile } = await db
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      const currentName = currentProfile?.full_name ?? 'Notandi';

      const isSelf = assignTo === user.id;
      let commentContent: string;

      if (isSelf) {
        commentContent = `${currentName} tók að sér verkefni`;
      } else {
        // Fetch target user's name
        const { data: targetProfile } = await db
          .from('profiles')
          .select('full_name')
          .eq('user_id', assignTo)
          .maybeSingle();
        const targetName = targetProfile?.full_name ?? 'Notandi';
        commentContent = `${currentName} úthlutaði verkefnið. Nýr ábyrgðaraðili: ${targetName}`;
      }

      // Insert system comment
      await db.from('task_comments').insert({
        task_id: taskId,
        user_id: user.id,
        content: commentContent,
        is_system: true,
      });

      // Extract target name from the structured comment
      const extractedName = isSelf ? currentName : (await (async () => {
        const { data: tp } = await db.from('profiles').select('full_name').eq('user_id', assignTo).maybeSingle();
        return tp?.full_name ?? 'Notandi';
      })());
      return { isSelf, targetName: extractedName };
    },
    onSuccess: (result, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      if (result?.isSelf) {
        toast.success('Þú ert nú eigandi þessa verkefnis ✓');
      } else {
        toast.success(`Verkefni úthlutað. Ábyrgðaraðili: ${result?.targetName}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}
