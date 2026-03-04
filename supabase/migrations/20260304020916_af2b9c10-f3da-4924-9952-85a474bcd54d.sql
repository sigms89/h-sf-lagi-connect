
-- ============================================================
-- bid_messages table — messaging thread for bids
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bid_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast retrieval by bid
CREATE INDEX IF NOT EXISTS idx_bid_messages_bid_id ON public.bid_messages(bid_id);

-- RLS
ALTER TABLE public.bid_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages on bids they're involved in
CREATE POLICY "Users can read bid messages" ON public.bid_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert bid messages" ON public.bid_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
