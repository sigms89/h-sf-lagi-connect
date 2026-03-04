// ============================================================
// Húsfélagið.is — Service Provider Hooks
// TanStack Query hooks for the provider dashboard
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import type { ServiceProvider, Bid, BidRequest } from '@/types/database';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

export interface ServiceProviderInsert {
  company_name: string;
  kennitala?: string;
  description_is?: string;
  website?: string;
  phone?: string;
  email?: string;
  service_area: string[];
  category_ids: string[];
}

export interface ServiceProviderUpdate {
  company_name?: string;
  kennitala?: string;
  description_is?: string;
  description_en?: string;
  logo_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  service_area?: string[];
}

export interface SubmitBidData {
  bid_request_id: string;
  provider_id: string;
  amount: number;
  description?: string;
  valid_until?: string;
}

export interface ProviderStats {
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
  openRequestsInArea: number;
  acceptanceRate: number;
}

// ============================================================
// QUERY KEYS
// ============================================================
export const PROVIDER_KEYS = {
  all: ['service-provider'] as const,
  current: () => [...PROVIDER_KEYS.all, 'current'] as const,
  myBids: (providerId: string) => [...PROVIDER_KEYS.all, 'bids', providerId] as const,
  stats: (providerId: string) => [...PROVIDER_KEYS.all, 'stats', providerId] as const,
  matchingRequests: (providerId: string) =>
    [...PROVIDER_KEYS.all, 'matching-requests', providerId] as const,
};

// ============================================================
// useCurrentProvider
// Get the service provider profile for the current user
// ============================================================
export function useCurrentProvider() {
  const { user } = useAuth();

  return useQuery({
    queryKey: PROVIDER_KEYS.current(),
    queryFn: async (): Promise<ServiceProvider | null> => {
      if (!user) return null;

      const { data, error } = await db
        .from('service_providers')
        .select(`
          *,
          categories:service_provider_categories(
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        service_area: Array.isArray(data.service_area) ? data.service_area : [],
        categories: (data as any).categories?.map(
          (sc: any) => sc.category
        ) ?? [],
      } as ServiceProvider;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// useCreateProvider
// Register as a new service provider
// ============================================================
export function useCreateProvider() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceProviderInsert): Promise<ServiceProvider> => {
      if (!user) throw new Error('Notandi ekki skráður inn');

      const { category_ids, ...providerData } = data;

      // 1. Create provider record
      const { data: provider, error: providerError } = await db
        .from('service_providers')
        .insert([{
          user_id: user.id,
          company_name: providerData.company_name,
          kennitala: providerData.kennitala ?? null,
          description_is: providerData.description_is ?? null,
          website: providerData.website ?? null,
          phone: providerData.phone ?? null,
          email: providerData.email ?? user.email ?? null,
          service_area: providerData.service_area,
          is_approved: false,
          subscription_status: 'pending',
        }])
        .select()
        .single();

      if (providerError) throw providerError;

      // 2. Add category associations
      if (category_ids.length > 0) {
        const categoryLinks = category_ids.map((catId) => ({
          provider_id: provider.id,
          category_id: catId,
        }));

        const { error: catError } = await db
          .from('service_provider_categories')
          .insert(categoryLinks);

        if (catError) throw catError;
      }

      return provider as ServiceProvider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_KEYS.current() });
      toast.success('Skráning móttekin — bíður samþykktar stjórnanda');
    },
    onError: (error: Error) => {
      toast.error(`Villa við skráningu: ${error.message}`);
    },
  });
}

// ============================================================
// useUpdateProvider
// Update provider profile
// ============================================================
export function useUpdateProvider() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      updates,
      categoryIds,
    }: {
      providerId: string;
      updates: ServiceProviderUpdate;
      categoryIds?: string[];
    }): Promise<void> => {
      if (!user) throw new Error('Notandi ekki skráður inn');

      const { error } = await db
        .from('service_providers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', providerId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update categories if provided
      if (categoryIds !== undefined) {
        // Delete existing
        await db
          .from('service_provider_categories')
          .delete()
          .eq('provider_id', providerId);

        if (categoryIds.length > 0) {
          const categoryLinks = categoryIds.map((catId) => ({
            provider_id: providerId,
            category_id: catId,
          }));

          const { error: catError } = await db
            .from('service_provider_categories')
            .insert(categoryLinks);

          if (catError) throw catError;
        }
      }

      queryClient.invalidateQueries({ queryKey: PROVIDER_KEYS.current() });
    },
    onSuccess: () => {
      toast.success('Prófíll uppfærður');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useProviderBidRequests
// Get open bid requests that match the provider's categories/area
// ============================================================
export function useProviderBidRequests(provider: ServiceProvider | null | undefined) {
  return useQuery({
    queryKey: PROVIDER_KEYS.matchingRequests(provider?.id ?? ''),
    queryFn: async (): Promise<BidRequest[]> => {
      if (!provider) return [];

      const categoryIds = provider.categories?.map((c) => c.id) ?? [];
      if (categoryIds.length === 0) return [];

      let query = db
        .from('bid_requests')
        .select(`
          *,
          category:categories(*),
          association:associations(num_units, building_year, postal_code, type, city)
        `)
        .eq('status', 'open')
        .in('category_id', categoryIds)
        .order('deadline', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by service area (postal code prefix match)
      const serviceAreas = provider.service_area ?? [];
      if (serviceAreas.length === 0) {
        return (data ?? []) as BidRequest[];
      }

      return (data ?? []).filter((req: any) => {
        if (!req.association?.postal_code) return true;
        return serviceAreas.some((area: string) => req.association!.postal_code!.startsWith(area));
      }) as BidRequest[];
    },
    enabled: !!provider,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useSubmitBid
// Submit a bid for a bid request
// ============================================================
export function useSubmitBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitBidData): Promise<Bid> => {
      const { data: result, error } = await db
        .from('bids')
        .insert([{
          bid_request_id: data.bid_request_id,
          provider_id: data.provider_id,
          amount: data.amount,
          description: data.description ?? null,
          valid_until: data.valid_until ?? null,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return result as Bid;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROVIDER_KEYS.myBids(variables.provider_id),
      });
      queryClient.invalidateQueries({
        queryKey: PROVIDER_KEYS.matchingRequests(variables.provider_id),
      });
      toast.success('Tilboð sent');
    },
    onError: (error: Error) => {
      toast.error(`Villa við sendingu tilboðs: ${error.message}`);
    },
  });
}

// ============================================================
// useMyBids
// Get all bids submitted by the current provider
// ============================================================
export function useMyBids(providerId: string | null | undefined) {
  return useQuery({
    queryKey: PROVIDER_KEYS.myBids(providerId ?? ''),
    queryFn: async (): Promise<Array<Bid & { bid_request: BidRequest }>> => {
      if (!providerId) return [];

      const { data, error } = await db
        .from('bids')
        .select(`
          *,
          bid_request:bid_requests(
            *,
            category:categories(*),
            association:associations(num_units, building_year, city)
          )
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Array<Bid & { bid_request: BidRequest }>;
    },
    enabled: !!providerId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useProviderStats
// Aggregated stats for the provider dashboard
// ============================================================
export function useProviderStats(providerId: string | null | undefined) {
  return useQuery({
    queryKey: PROVIDER_KEYS.stats(providerId ?? ''),
    queryFn: async (): Promise<ProviderStats> => {
      const empty: ProviderStats = {
        totalBids: 0,
        pendingBids: 0,
        acceptedBids: 0,
        rejectedBids: 0,
        openRequestsInArea: 0,
        acceptanceRate: 0,
      };

      if (!providerId) return empty;

      const { data, error } = await db
        .from('bids')
        .select('status')
        .eq('provider_id', providerId);

      if (error) throw error;

      const bids = data ?? [];
      const totalBids = bids.length;
      const pendingBids = bids.filter((b: { status: string }) => b.status === 'pending').length;
      const acceptedBids = bids.filter((b: { status: string }) => b.status === 'accepted').length;
      const rejectedBids = bids.filter((b: { status: string }) => b.status === 'rejected').length;
      const resolved = acceptedBids + rejectedBids;
      const acceptanceRate = resolved > 0 ? Math.round((acceptedBids / resolved) * 100) : 0;

      return {
        totalBids,
        pendingBids,
        acceptedBids,
        rejectedBids,
        openRequestsInArea: 0, // Computed via useProviderBidRequests
        acceptanceRate,
      };
    },
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
  });
}
