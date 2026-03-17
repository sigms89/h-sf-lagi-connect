// ============================================================
// Húsfélagið.is: Shared useProfile hook
// Single source of truth for the current user's profile
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/database';

export const PROFILE_KEYS = {
  current: (userId: string | undefined) => ['profile', userId] as const,
};

/**
 * Shared hook for fetching the current user's profile.
 * Uses a stable queryKey so all consumers share the same cache entry.
 */
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: PROFILE_KEYS.current(user?.id),
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}
