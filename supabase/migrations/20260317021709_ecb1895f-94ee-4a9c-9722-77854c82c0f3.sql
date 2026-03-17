-- Tighten bid_messages SELECT: only bid participants can read messages
-- (association members who own the bid request, or the provider who submitted the bid)
DROP POLICY IF EXISTS "Users can read bid messages" ON public.bid_messages;

CREATE POLICY "Bid participants can read messages"
  ON public.bid_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bids b
      JOIN public.bid_requests br ON br.id = b.bid_request_id
      WHERE b.id = bid_messages.bid_id
        AND (
          -- Provider who owns the bid
          EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = b.provider_id AND sp.user_id = auth.uid())
          -- Association member who owns the bid request
          OR is_association_member(br.association_id)
        )
    )
  );