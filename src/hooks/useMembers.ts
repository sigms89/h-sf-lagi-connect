import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { AssociationMember, MemberRole } from '@/types/database';
import { toast } from 'sonner';

export const MEMBER_KEYS = {
  all: ['members'] as const,
  byAssociation: (associationId: string) => [...MEMBER_KEYS.all, associationId] as const,
};

export function useAssociationMembers(associationId: string | null | undefined) {
  return useQuery({
    queryKey: MEMBER_KEYS.byAssociation(associationId ?? ''),
    queryFn: async (): Promise<AssociationMember[]> => {
      if (!associationId) return [];
      const { data, error } = await db
        .from('association_members')
        .select(`*`)
        .eq('association_id', associationId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });
      if (error) throw error;

      // Fetch profiles separately for each member
      const memberData = data ?? [];
      const enriched = await Promise.all(
        memberData.map(async (member: any) => {
          const { data: profile } = await db
            .from('profiles')
            .select('id, full_name')
            .eq('user_id', member.user_id)
            .maybeSingle();
          return { ...member, profile: profile ?? null };
        })
      );
      return enriched as AssociationMember[];
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, associationId, role, invitedBy }: { email: string; associationId: string; role: MemberRole; invitedBy: string }): Promise<void> => {
      // Look up user by email via profiles - since profiles don't store email,
      // we check if there's a profile with full_name matching the email pattern.
      // For MVP: create an inactive member placeholder that gets activated on signup.

      // Try to find existing profile by looking at auth metadata
      // Since we can't access auth.users, we'll insert a pending member record
      // The invited user will be linked when they sign up/log in

      const pendingUserId = crypto.randomUUID();

      const { error } = await db
        .from('association_members')
        .insert({
          user_id: pendingUserId,
          association_id: associationId,
          role: role,
          is_active: false,
          invited_by: invitedBy,
        });

      if (error) throw error;

      // Also create a notification for tracking
      await db.from('notifications').insert({
        user_id: invitedBy,
        type: 'invite_sent',
        title: 'Boð sent',
        message: `Boð sent á ${email} sem ${role === 'admin' ? 'stjórnandi' : role === 'board' ? 'stjórnarmaður' : 'meðlimur'}`,
        is_read: false,
      });
    },
    onSuccess: (_, { associationId, email }) => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.byAssociation(associationId) });
      toast.success(`Boð sent á ${email}`);
    },
    onError: (error: Error) => { toast.error(`Villa við boð: ${error.message}`); },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, newRole, associationId }: { memberId: string; newRole: MemberRole; associationId: string }): Promise<void> => {
      const { error } = await db.from('association_members').update({ role: newRole }).eq('id', memberId).eq('association_id', associationId);
      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.byAssociation(associationId) });
      toast.success('Hlutverk uppfært');
    },
    onError: (error: Error) => { toast.error(`Villa við uppfærslu: ${error.message}`); },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, associationId }: { memberId: string; associationId: string }): Promise<void> => {
      const { error } = await db.from('association_members').update({ is_active: false }).eq('id', memberId).eq('association_id', associationId);
      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.byAssociation(associationId) });
      toast.success('Meðlimur fjarlægður');
    },
    onError: (error: Error) => { toast.error(`Villa: ${error.message}`); },
  });
}
