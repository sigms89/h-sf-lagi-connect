import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { BidMessage } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const BID_MESSAGE_KEYS = {
  all: ['bid-messages'] as const,
  byBid: (bidId: string) => [...BID_MESSAGE_KEYS.all, bidId] as const,
};

export function useBidMessages(bidId: string | null | undefined) {
  return useQuery({
    queryKey: BID_MESSAGE_KEYS.byBid(bidId ?? ''),
    queryFn: async (): Promise<BidMessage[]> => {
      if (!bidId) return [];
      const { data, error } = await db
        .from('bid_messages')
        .select('*')
        .eq('bid_id', bidId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as BidMessage[];
    },
    enabled: !!bidId,
    refetchInterval: 10_000, // Poll every 10s for new messages
  });
}

export function useSendBidMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, message }: { bidId: string; message: string }): Promise<void> => {
      if (!user) throw new Error('Notandi ekki skráður inn');
      const { error } = await db.from('bid_messages').insert({
        bid_id: bidId,
        sender_id: user.id,
        message,
      });
      if (error) throw error;
    },
    onSuccess: (_, { bidId }) => {
      queryClient.invalidateQueries({ queryKey: BID_MESSAGE_KEYS.byBid(bidId) });
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}
