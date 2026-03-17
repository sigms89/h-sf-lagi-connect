-- ============================================================
-- Provider Reviews & Portfolio Images + Storage Bucket
-- ============================================================

-- 1. provider_reviews table
CREATE TABLE public.provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  bid_request_id uuid NOT NULL REFERENCES public.bid_requests(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  provider_response text,
  response_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, association_id)
);

-- Validation trigger for rating 1-5
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review_rating
  BEFORE INSERT OR UPDATE ON public.provider_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Auto-update updated_at
CREATE TRIGGER trg_provider_reviews_updated_at
  BEFORE UPDATE ON public.provider_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated
CREATE POLICY "Anyone authenticated can view reviews"
  ON public.provider_reviews FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: association admin with accepted bid
CREATE POLICY "Association admins with accepted bid can review"
  ON public.provider_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND is_association_admin(association_id)
    AND EXISTS (
      SELECT 1 FROM public.bids b
      JOIN public.bid_requests br ON br.id = b.bid_request_id
      JOIN public.service_providers sp ON sp.id = b.provider_id
      WHERE b.bid_request_id = provider_reviews.bid_request_id
        AND br.association_id = provider_reviews.association_id
        AND sp.id = provider_reviews.provider_id
        AND b.status = 'accepted'
    )
  );

-- UPDATE own review (rating/comment): association admin
CREATE POLICY "Association admins can update own review"
  ON public.provider_reviews FOR UPDATE
  TO authenticated
  USING (
    is_association_admin(association_id)
    AND created_by = auth.uid()
  );

-- UPDATE provider_response: provider owner
CREATE POLICY "Provider owner can respond to reviews"
  ON public.provider_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = provider_reviews.provider_id
        AND sp.user_id = auth.uid()
    )
  );

-- 2. provider_portfolio_images table
CREATE TABLE public.provider_portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.provider_portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view portfolio images"
  ON public.provider_portfolio_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Provider owner can manage portfolio images"
  ON public.provider_portfolio_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = provider_portfolio_images.provider_id
        AND sp.user_id = auth.uid()
    )
  );

-- 3. Storage bucket for provider media
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-media', 'provider-media', true);

-- Storage RLS: anyone can view
CREATE POLICY "Public read access on provider-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-media');

-- Storage RLS: authenticated can upload
CREATE POLICY "Authenticated users can upload to provider-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'provider-media');

-- Storage RLS: owners can delete their files
CREATE POLICY "Users can manage own provider-media files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'provider-media');

CREATE POLICY "Users can update own provider-media files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'provider-media');