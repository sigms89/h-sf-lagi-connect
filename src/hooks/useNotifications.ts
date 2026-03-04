import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  mine: (userId: string) => [...NOTIFICATION_KEYS.all, userId] as const,
  unreadCount: (userId: string) => [...NOTIFICATION_KEYS.all, 'unread', userId] as const,
};

export function useMyNotifications(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.mine(user?.id ?? ''),
    queryFn: async (): Promise<AppNotification[]> => {
      if (!user) return [];
      const { data, error } = await db
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(user?.id ?? ''),
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { count, error } = await db
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const { error } = await db
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.mine(user.id) });
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount(user.id) });
      }
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user) return;
      const { error } = await db
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.mine(user.id) });
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount(user.id) });
      }
    },
  });
}
