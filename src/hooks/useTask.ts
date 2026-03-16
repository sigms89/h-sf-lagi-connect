// ============================================================
// useTask — Single task fetch + mutations (assign, complete)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast.success('Verkefni klárað ✓');
    },
    onError: (error: Error) => {
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
        commentContent = `${currentName} úthlutar verkefni til ${targetName}`;
      }

      // Insert system comment
      await db.from('task_comments').insert({
        task_id: taskId,
        user_id: user.id,
        content: commentContent,
        is_system: true,
      });

      return { isSelf, targetName: isSelf ? currentName : commentContent.split(' til ')[1] };
    },
    onSuccess: (result, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      if (result?.isSelf) {
        toast.success('Þú ert nú eigandi þessa verkefnis ✓');
      } else {
        toast.success(`Verkefni úthlutað ${result?.targetName}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}
