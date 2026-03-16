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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await db
        .from('tasks')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success('Verkefni merkt sem lokið');
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

      const { error } = await db
        .from('tasks')
        .update({ assigned_to: assignTo })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success('Verkefni úthlutað');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}
