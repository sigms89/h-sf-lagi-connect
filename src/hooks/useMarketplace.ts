// ============================================================
// Húsfélagið.is — Marketplace Hooks
// TanStack Query hooks for bid requests and service providers
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import type {
  BidRequest,
  BidRequestStatus,
  Bid,
  BidStatus,
  ServiceProvider,
} from '@/types/database';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

export interface BidRequestInsert {
  association_id: string;
  created_by: string;
  category_id: string;
  title: string;
  description?: string;
  deadline?: string;
}

export interface BidInsert {
  bid_request_id: string;
  provider_id: string;
  amount: number;
  description?: string;
  valid_until?: string;
}

// ============================================================
// QUERY KEYS
// ============================================================
export const MARKETPLACE_KEYS = {
  all: ['marketplace'] as const,
  bidRequests: (assocId: string) => [...MARKETPLACE_KEYS.all, 'bid-requests', assocId] as const,
  bidRequest: (id: string) => [...MARKETPLACE_KEYS.all, 'bid-request', id] as const,
  bids: (bidRequestId: string) => [...MARKETPLACE_KEYS.all, 'bids', bidRequestId] as const,
  providers: (catId?: string, area?: string) =>
    [...MARKETPLACE_KEYS.all, 'providers', catId, area] as const,
  openRequests: () => [...MARKETPLACE_KEYS.all, 'open-requests'] as const,
};

// ============================================================
// useBidRequests
// Get all bid requests for an association
// ============================================================
export function useBidRequests(associationId: string | null | undefined) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.bidRequests(associationId ?? ''),
    queryFn: async (): Promise<BidRequest[]> => {
      if (!associationId) return [];

      const { data, error } = await db
        .from('bid_requests')
        .select(`
          *,
          category:categories(*),
          bids(id, status)
        `)
        .eq('association_id', associationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        ...r,
        bid_count: r.bids?.length ?? 0,
      })) as BidRequest[];
    },
    enabled: !!associationId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useBidRequest
// Single bid request with full details
// ============================================================
export function useBidRequest(bidRequestId: string | null | undefined) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.bidRequest(bidRequestId ?? ''),
    queryFn: async (): Promise<BidRequest | null> => {
      if (!bidRequestId) return null;

      const { data, error } = await db
        .from('bid_requests')
        .select(`
          *,
          category:categories(*),
          bids(
            *,
            provider:service_providers(*)
          )
        `)
        .eq('id', bidRequestId)
        .maybeSingle();

      if (error) throw error;
      return data as BidRequest | null;
    },
    enabled: !!bidRequestId,
    staleTime: 1 * 60 * 1000,
  });
}

// ============================================================
// useCreateBidRequest
// ============================================================
export function useCreateBidRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BidRequestInsert): Promise<BidRequest> => {
      const { data: result, error } = await db
        .from('bid_requests')
        .insert([{
          association_id: data.association_id,
          created_by: data.created_by,
          category_id: data.category_id,
          title: data.title,
          description: data.description ?? null,
          deadline: data.deadline ?? null,
          status: 'open',
        }])
        .select(`*, category:categories(*)`)
        .single();

      if (error) throw error;
      return result as BidRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_KEYS.bidRequests(variables.association_id),
      });
      toast.success('Tilboðsbeiðni send');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useCloseBidRequest
// Close or cancel a bid request, optionally awarding a bid
// ============================================================
export function useCloseBidRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bidRequestId,
      status,
      associationId,
    }: {
      bidRequestId: string;
      status: BidRequestStatus;
      associationId: string;
    }): Promise<void> => {
      const { error } = await db
        .from('bid_requests')
        .update({ status })
        .eq('id', bidRequestId);

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_KEYS.bidRequests(associationId),
      });
      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_KEYS.bidRequest(bidRequestId),
      });
    },
    onSuccess: () => {
      toast.success('Tilboðsbeiðni uppfærð');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useAcceptBid
// Accept a specific bid and auto-reject the others
// ============================================================
export function useAcceptBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bidId,
      bidRequestId,
      associationId,
    }: {
      bidId: string;
      bidRequestId: string;
      associationId: string;
    }): Promise<void> => {
      // 1. Accept the selected bid
      const { error: acceptError } = await db
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (acceptError) throw acceptError;

      // 2. Reject all other bids for this request
      const { error: rejectError } = await db
        .from('bids')
        .update({ status: 'rejected' })
        .eq('bid_request_id', bidRequestId)
        .neq('id', bidId)
        .eq('status', 'pending');

      if (rejectError) throw rejectError;

      // 3. Mark bid request as awarded
      const { error: awardError } = await db
        .from('bid_requests')
        .update({ status: 'awarded' })
        .eq('id', bidRequestId);

      if (awardError) throw awardError;

      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_KEYS.bidRequest(bidRequestId),
      });
      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_KEYS.bidRequests(associationId),
      });
    },
    onSuccess: () => {
      toast.success('Tilboð samþykkt — önnur tilboð hafnað');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useBids
// Get all bids for a specific bid request
// ============================================================
export function useBids(bidRequestId: string | null | undefined) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.bids(bidRequestId ?? ''),
    queryFn: async (): Promise<Bid[]> => {
      if (!bidRequestId) return [];

      const { data, error } = await db
        .from('bids')
        .select(`
          *,
          provider:service_providers(*)
        `)
        .eq('bid_request_id', bidRequestId)
        .order('amount', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Bid[];
    },
    enabled: !!bidRequestId,
    staleTime: 1 * 60 * 1000,
  });
}

// ============================================================
// useProviders
// Get approved service providers, optionally filtered
// ============================================================
export function useProviders(categoryId?: string, area?: string) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.providers(categoryId, area),
    queryFn: async (): Promise<ServiceProvider[]> => {
      let query = db
        .from('service_providers')
        .select(`
          *,
          categories:service_provider_categories(
            category:categories(*)
          )
        `)
        .eq('is_approved', true)
        .order('company_name');

      const { data, error } = await query;
      if (error) throw error;

      let results = (data ?? []).map((p: any) => ({
        ...p,
        service_area: Array.isArray(p.service_area) ? p.service_area : [],
        categories: p.categories?.map((sc: any) => sc.category) ?? [],
      })) as ServiceProvider[];

      // Filter by category client-side
      if (categoryId) {
        results = results.filter((p) =>
          p.categories?.some((c) => c.id === categoryId)
        );
      }

      // Filter by area client-side
      if (area) {
        results = results.filter((p) =>
          p.service_area?.includes(area)
        );
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// useOpenBidRequests
// Get all open bid requests (for providers)
// ============================================================
export function useOpenBidRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MARKETPLACE_KEYS.openRequests(),
    queryFn: async (): Promise<BidRequest[]> => {
      const { data, error } = await db
        .from('bid_requests')
        .select(`
          *,
          category:categories(*),
          association:associations(num_units, building_year, postal_code, type)
        `)
        .eq('status', 'open')
        .order('deadline', { ascending: true });

      if (error) throw error;
      return (data ?? []) as BidRequest[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}
