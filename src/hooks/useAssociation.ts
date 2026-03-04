import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import type { Association, AssociationInsert, AssociationUpdate } from '@/types/database';
import { toast } from 'sonner';

export const ASSOCIATION_KEYS = {
  all: ['associations'] as const,
  current: () => [...ASSOCIATION_KEYS.all, 'current'] as const,
  byId: (id: string) => [...ASSOCIATION_KEYS.all, id] as const,
};

export function useCurrentAssociation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ASSOCIATION_KEYS.current(),
    queryFn: async (): Promise<Association | null> => {
      if (!user) return null;

      const { data, error } = await db
        .from('association_members')
        .select(`association_id, role, associations (*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      if (!data) return null;
      return data?.associations ?? null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAssociation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssociationInsert): Promise<Association> => {
      if (!user) throw new Error('Notandi ekki skráður inn');

      const associationId = crypto.randomUUID();

      // Step 1: INSERT association WITHOUT .select() to avoid SELECT RLS check
      const { error: assocError } = await db
        .from('associations')
        .insert([{ ...data, id: associationId }]);

      if (assocError) throw assocError;

      // Step 2: INSERT membership so user becomes a member/admin
      const { error: memberError } = await db
        .from('association_members')
        .insert([{
          user_id: user.id,
          association_id: associationId,
          role: 'admin',
          is_active: true,
        }]);

      if (memberError) throw memberError;

      // Return constructed object (we can't SELECT yet until cache refreshes)
      const association: Association = {
        id: associationId,
        name: data.name,
        num_units: data.num_units ?? 1,
        address: data.address ?? null,
        building_year: data.building_year ?? null,
        city: data.city ?? null,
        created_at: new Date().toISOString(),
        has_elevator: data.has_elevator ?? null,
        has_parking: data.has_parking ?? null,
        num_floors: data.num_floors ?? null,
        postal_code: data.postal_code ?? null,
        square_meters_total: data.square_meters_total ?? null,
        subscription_status: data.subscription_status ?? 'active',
        subscription_tier: data.subscription_tier ?? 'free',
        type: data.type ?? 'fjolbyli',
        updated_at: new Date().toISOString(),
      };

      return association;
    },
    onSuccess: (association) => {
      // Set current association immediately to prevent redirect loop
      queryClient.setQueryData(ASSOCIATION_KEYS.current(), association);
      queryClient.invalidateQueries({ queryKey: ASSOCIATION_KEYS.all });
      toast.success(`Húsfélagið "${association.name}" hefur verið stofnað`);
    },
    onError: (error: Error) => {
      toast.error(`Villa við stofnun húsfélags: ${error.message}`);
    },
  });
}

export function useUpdateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AssociationUpdate }): Promise<Association> => {
      const { data, error } = await db
        .from('associations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Association;
    },
    onSuccess: (association) => {
      queryClient.invalidateQueries({ queryKey: ASSOCIATION_KEYS.all });
      queryClient.setQueryData(ASSOCIATION_KEYS.byId(association.id), association);
      toast.success('Stillingar uppfærðar');
    },
    onError: (error: Error) => {
      toast.error(`Villa við uppfærslu: ${error.message}`);
    },
  });
}
