// ============================================================
// useTaskComments: Fetch and add comments on a task
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  is_system: boolean;
  created_at: string;
  author_name: string | null;
}

export const COMMENT_KEYS = {
  byTask: (taskId: string) => ['task_comments', taskId] as const,
};

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: COMMENT_KEYS.byTask(taskId ?? ''),
    queryFn: async (): Promise<TaskComment[]> => {
      if (!taskId) return [];

      const { data, error } = await db
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const comments = data ?? [];

      // Enrich with author names
      const uniqueUserIds = [...new Set(comments.map((c: any) => c.user_id))];
      const profileMap = new Map<string, string>();

      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          const { data: profile } = await db
            .from('profiles')
            .select('full_name')
            .eq('user_id', uid)
            .maybeSingle();
          if (profile?.full_name) profileMap.set(uid as string, profile.full_name);
        })
      );

      return comments.map((c: any) => ({
        ...c,
        author_name: profileMap.get(c.user_id) ?? null,
      }));
    },
    enabled: !!taskId,
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      if (!user) throw new Error('Notandi ekki skráður inn');

      const { error } = await db
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
          is_system: false,
        });
      if (error) throw error;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.byTask(taskId) });
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}
