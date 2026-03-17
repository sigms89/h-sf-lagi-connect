// ============================================================
// Húsfélagið.is: useProviderReviews
// CRUD for provider reviews + average rating
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ProviderReview {
  id: string;
  provider_id: string;
  association_id: string;
  bid_request_id: string;
  created_by: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  response_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  association_num_units?: number;
  association_postal_code?: string | null;
}

export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

export function useProviderReviews(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await db
        .from('provider_reviews')
        .select('*, associations!provider_reviews_association_id_fkey(num_units, postal_code)')
        .eq('provider_id', providerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        ...r,
        association_num_units: r.associations?.num_units,
        association_postal_code: r.associations?.postal_code,
      })) as ProviderReview[];
    },
  });
}

export function useProviderReviewStats(providerId: string | undefined) {
  const { data: reviews = [] } = useProviderReviews(providerId);

  const stats: ReviewStats = {
    averageRating:
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    reviewCount: reviews.length,
  };

  return stats;
}

// Check if current user can review this provider (is admin of an association with accepted bid)
export function useCanReview(providerId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-review', providerId, user?.id],
    enabled: !!providerId && !!user,
    queryFn: async () => {
      // Find accepted bids for this provider where user is admin
      const { data: bids, error } = await db
        .from('bids')
        .select('id, bid_request_id, bid_requests!bids_bid_request_id_fkey(id, association_id)')
        .eq('provider_id', providerId!)
        .eq('status', 'accepted');

      if (error) throw error;
      if (!bids || bids.length === 0) return { canReview: false, eligibleBids: [] };

      // Check which associations the user is admin of
      const eligibleBids: Array<{ bid_request_id: string; association_id: string }> = [];
      for (const bid of bids) {
        const br = (bid as any).bid_requests;
        if (br?.association_id) {
          // Check if user is admin of this association
          const { data: membership } = await db
            .from('association_members')
            .select('role')
            .eq('association_id', br.association_id)
            .eq('user_id', user!.id)
            .eq('is_active', true)
            .in('role', ['admin', 'board'])
            .maybeSingle();

          if (membership) {
            eligibleBids.push({
              bid_request_id: br.id,
              association_id: br.association_id,
            });
          }
        }
      }

      // Check if already reviewed
      if (eligibleBids.length > 0) {
        const { data: existingReviews } = await db
          .from('provider_reviews')
          .select('association_id')
          .eq('provider_id', providerId!)
          .in('association_id', eligibleBids.map((b) => b.association_id));

        const reviewedAssocIds = new Set((existingReviews ?? []).map((r: any) => r.association_id));
        const unreviewedBids = eligibleBids.filter((b) => !reviewedAssocIds.has(b.association_id));

        return { canReview: unreviewedBids.length > 0, eligibleBids: unreviewedBids };
      }

      return { canReview: false, eligibleBids: [] };
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      provider_id: string;
      association_id: string;
      bid_request_id: string;
      rating: number;
      comment: string;
    }) => {
      const { error } = await db.from('provider_reviews').insert({
        provider_id: params.provider_id,
        association_id: params.association_id,
        bid_request_id: params.bid_request_id,
        created_by: user!.id,
        rating: params.rating,
        comment: params.comment || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ['provider-reviews', params.provider_id] });
      qc.invalidateQueries({ queryKey: ['can-review', params.provider_id] });
      toast.success('Umsögn skráð');
    },
    onError: (err: any) => {
      toast.error(`Villa: ${err.message}`);
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      reviewId: string;
      providerId: string;
      rating: number;
      comment: string;
    }) => {
      const { error } = await db
        .from('provider_reviews')
        .update({ rating: params.rating, comment: params.comment || null })
        .eq('id', params.reviewId);
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ['provider-reviews', params.providerId] });
      toast.success('Umsögn uppfærð');
    },
    onError: (err: any) => {
      toast.error(`Villa: ${err.message}`);
    },
  });
}

export function useRespondToReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      reviewId: string;
      providerId: string;
      response: string;
    }) => {
      const { error } = await db
        .from('provider_reviews')
        .update({
          provider_response: params.response,
          response_at: new Date().toISOString(),
        })
        .eq('id', params.reviewId);
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ['provider-reviews', params.providerId] });
      toast.success('Svar vistað');
    },
    onError: (err: any) => {
      toast.error(`Villa: ${err.message}`);
    },
  });
}
