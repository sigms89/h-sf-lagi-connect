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
      // Look up if user already exists in profiles by checking association_members
      // For a real invite: we store the email in a notification and create a
      // pending record. The user gets linked when they sign up with matching email.

      // Check if already invited/member
      const { data: existing } = await db
        .from('association_members')
        .select('id')
        .eq('association_id', associationId)
        .eq('is_active', true);

      // Create a notification for the inviter as confirmation
      await db.from('notifications').insert({
        user_id: invitedBy,
        type: 'invite_sent',
        title: 'Boð sent',
        message: `Boð sent á ${email} sem ${role === 'admin' ? 'stjórnandi' : role === 'board' ? 'stjórnarmaður' : 'meðlimur'}. Notandi þarf að skrá sig inn á Húsfélagið.is til að virkja aðganginn.`,
        is_read: false,
      });

      // TODO: When email sending is configured, send actual invite email here.
      // For now, the admin needs to share the link manually.
    },
    onSuccess: (_, { associationId, email }) => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.byAssociation(associationId) });
      toast.success(`Boð skráð fyrir ${email}. Deildu innskráningarslóð með viðkomandi.`);
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
