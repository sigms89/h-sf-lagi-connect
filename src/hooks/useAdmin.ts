// ============================================================
// Húsfélagið.is — Admin Hooks
// TanStack Query hooks for the super admin panel
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import type { Association, ServiceProvider, VendorRule } from '@/types/database';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

export interface AdminStats {
  totalAssociations: number;
  activeUsers: number;
  approvedProviders: number;
  pendingProviders: number;
  totalBidRequests: number;
  openBidRequests: number;
  // Tier breakdown
  freeTier: number;
  plusTier: number;
  proTier: number;
}

export interface NotificationPayload {
  title: string;
  message: string;
  target: 'all' | 'free' | 'plus' | 'pro';
}

export interface VendorRuleInsert {
  keyword_pattern: string;
  category_id: string;
  priority: number;
  is_global: boolean;
  association_id?: string | null;
}

// ============================================================
// QUERY KEYS
// ============================================================
export const ADMIN_KEYS = {
  all: ['admin'] as const,
  stats: () => [...ADMIN_KEYS.all, 'stats'] as const,
  associations: (search?: string, page?: number) =>
    [...ADMIN_KEYS.all, 'associations', search, page] as const,
  providers: (status?: string) => [...ADMIN_KEYS.all, 'providers', status] as const,
  vendorRules: () => [...ADMIN_KEYS.all, 'vendor-rules'] as const,
  pendingRules: () => [...ADMIN_KEYS.all, 'pending-rules'] as const,
};

// ============================================================
// useAdminStats
// ============================================================
export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats(),
    queryFn: async (): Promise<AdminStats> => {
      const [
        assocResult,
        providerResult,
        bidResult,
        openBidResult,
      ] = await Promise.all([
        db.from('associations').select('id, subscription_tier', { count: 'exact' }),
        db.from('service_providers').select('id, is_approved', { count: 'exact' }),
        db.from('bid_requests').select('id', { count: 'exact', head: true }),
        db
          .from('bid_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open'),
      ]);

      const assocData = assocResult.data ?? [];
      const providerData = providerResult.data ?? [];

      const freeTier = assocData.filter(
        (a: { subscription_tier: string }) => a.subscription_tier === 'free'
      ).length;
      const plusTier = assocData.filter(
        (a: { subscription_tier: string }) => a.subscription_tier === 'plus'
      ).length;
      const proTier = assocData.filter(
        (a: { subscription_tier: string }) => a.subscription_tier === 'pro'
      ).length;

      return {
        totalAssociations: assocResult.count ?? 0,
        activeUsers: assocResult.count ?? 0, // proxy: one admin per association min
        approvedProviders: providerData.filter(
          (p: { is_approved: boolean }) => p.is_approved
        ).length,
        pendingProviders: providerData.filter(
          (p: { is_approved: boolean }) => !p.is_approved
        ).length,
        totalBidRequests: bidResult.count ?? 0,
        openBidRequests: openBidResult.count ?? 0,
        freeTier,
        plusTier,
        proTier,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useAllAssociations
// Paginated list of all associations
// ============================================================
export function useAllAssociations(search?: string, page = 1, pageSize = 25) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ADMIN_KEYS.associations(search, page),
    queryFn: async (): Promise<{ data: Association[]; count: number }> => {
      let query = db
        .from('associations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: (data ?? []) as Association[], count: count ?? 0 };
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useAllProviders
// List providers by approval status
// ============================================================
export function useAllProviders(status?: 'pending' | 'approved' | 'all') {
  return useQuery({
    queryKey: ADMIN_KEYS.providers(status),
    queryFn: async (): Promise<ServiceProvider[]> => {
      let query = db
        .from('service_providers')
        .select(`
          *,
          categories:service_provider_categories(
            category:categories(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (status === 'pending') {
        query = query.eq('is_approved', false);
      } else if (status === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((p: any) => ({
        ...p,
        service_area: Array.isArray(p.service_area) ? p.service_area : [],
        categories: p.categories?.map((sc: any) => sc.category) ?? [],
      })) as ServiceProvider[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useApproveProvider
// ============================================================
export function useApproveProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerId: string): Promise<void> => {
      const { error } = await db
        .from('service_providers')
        .update({ is_approved: true, subscription_status: 'active' })
        .eq('id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.providers() });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats() });
      toast.success('Þjónustuaðili samþykktur');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useRejectProvider
// ============================================================
export function useRejectProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerId: string): Promise<void> => {
      const { error } = await db
        .from('service_providers')
        .update({ is_approved: false, subscription_status: 'rejected' })
        .eq('id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.providers() });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats() });
      toast.success('Þjónustuaðila hafnað');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useGlobalVendorRules
// ============================================================
export function useGlobalVendorRules() {
  return useQuery({
    queryKey: ADMIN_KEYS.vendorRules(),
    queryFn: async (): Promise<VendorRule[]> => {
      const { data, error } = await db
        .from('vendor_rules')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_global', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data ?? []) as VendorRule[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// usePendingVendorRules
// Association-level suggestions flagged for global review
// ============================================================
export function usePendingVendorRules() {
  return useQuery({
    queryKey: ADMIN_KEYS.pendingRules(),
    queryFn: async (): Promise<VendorRule[]> => {
      const { data, error } = await db
        .from('vendor_rules')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_global', false)
        .not('association_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as VendorRule[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useCreateVendorRule
// ============================================================
export function useCreateVendorRule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VendorRuleInsert): Promise<VendorRule> => {
      const { data: result, error } = await db
        .from('vendor_rules')
        .insert([{
          keyword_pattern: data.keyword_pattern,
          category_id: data.category_id,
          priority: data.priority,
          is_global: data.is_global,
          association_id: data.association_id ?? null,
          created_by: user?.id ?? null,
        }])
        .select(`*, category:categories(*)`)
        .single();

      if (error) throw error;
      return result as VendorRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.vendorRules() });
      toast.success('Regla stofnuð');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useUpdateVendorRule
// ============================================================
export function useUpdateVendorRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<VendorRuleInsert>;
    }): Promise<void> => {
      const { error } = await db.from('vendor_rules').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.vendorRules() });
      toast.success('Regla uppfærð');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useDeleteVendorRule
// ============================================================
export function useDeleteVendorRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await db.from('vendor_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.vendorRules() });
      toast.success('Regla eytt');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useUpdateAssociationTier
// ============================================================
export function useUpdateAssociationTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      associationId,
      tier,
    }: {
      associationId: string;
      tier: 'free' | 'plus' | 'pro';
    }): Promise<void> => {
      const { error } = await db
        .from('associations')
        .update({ subscription_tier: tier })
        .eq('id', associationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.associations() });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats() });
      toast.success('Áskrift uppfærð');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useSendNotification
// ============================================================
export function useSendNotification() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: NotificationPayload): Promise<void> => {
      if (!user) throw new Error('Notandi ekki skráður inn');

      // Get target association user IDs
      let usersQuery = db
        .from('association_members')
        .select('user_id, associations(subscription_tier)')
        .eq('is_active', true);

      if (payload.target !== 'all') {
        // We filter client-side since we need to join
      }

      const { data: members, error: membersError } = await usersQuery;
      if (membersError) throw membersError;

      // Filter by tier if needed
      let targetUserIds: string[] = (members ?? []).map(
        (m: { user_id: string }) => m.user_id
      );

      if (payload.target !== 'all') {
        targetUserIds = (members ?? [])
          .filter((m: { user_id: string; associations: { subscription_tier: string } | null }) =>
            m.associations?.subscription_tier === payload.target
          )
          .map((m: { user_id: string }) => m.user_id);
      }

      // Insert notification for each user
      const notifications = targetUserIds.map((userId: string) => ({
        user_id: userId,
        type: 'system',
        title: payload.title,
        message: payload.message,
        is_read: false,
        related_entity_type: null,
        related_entity_id: null,
      }));

      if (notifications.length === 0) return;

      // Insert in chunks of 100
      const CHUNK = 100;
      for (let i = 0; i < notifications.length; i += CHUNK) {
        const { error } = await db
          .from('notifications')
          .insert(notifications.slice(i, i + CHUNK));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Tilkynning send');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}
