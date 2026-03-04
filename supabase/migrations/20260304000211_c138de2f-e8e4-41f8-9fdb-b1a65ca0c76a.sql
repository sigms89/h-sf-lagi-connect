
-- ============================================================
-- Húsfélagið.is — Phase 1: Full Schema Migration
-- ============================================================

-- Add role_type to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'member' 
    CHECK (role_type IN ('super_admin', 'admin', 'board', 'member', 'service_provider'));

-- ============================================================
-- 1. ASSOCIATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  city TEXT DEFAULT 'Reykjavík',
  num_units INTEGER NOT NULL DEFAULT 1,
  building_year INTEGER,
  has_elevator BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  num_floors INTEGER DEFAULT 1,
  square_meters_total DECIMAL(10,2),
  type TEXT DEFAULT 'fjolbyli' CHECK (type IN ('fjolbyli','radhus','parhus')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','plus','pro')),
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER handle_associations_updated_at
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. ASSOCIATION_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.association_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','board','member')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, association_id)
);

CREATE INDEX IF NOT EXISTS idx_association_members_user_id ON public.association_members(user_id);
CREATE INDEX IF NOT EXISTS idx_association_members_association_id ON public.association_members(association_id);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_is TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN DEFAULT true,
  parent_category_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name_is, name_en, icon, color, is_system) VALUES
('Rafmagn & Hiti', 'Electricity & Heat', 'zap', 'amber', true),
('Vatnsveita', 'Water', 'droplets', 'blue', true),
('Tryggingar', 'Insurance', 'shield', 'indigo', true),
('Viðhald & Viðgerðir', 'Maintenance', 'wrench', 'orange', true),
('Garðyrkja & Umhverfi', 'Landscaping', 'trees', 'green', true),
('Öryggisgæsla', 'Security', 'lock', 'red', true),
('Ræsting & Þrif', 'Cleaning', 'sparkles', 'purple', true),
('Lyftuþjónusta', 'Elevator Service', 'arrow-up', 'gray', true),
('Húsfélagsgjöld (innborgun)', 'HOA Fees (Income)', 'coins', 'emerald', true),
('Vaxtakostnaður', 'Interest Expense', 'trending-down', 'slate', true),
('Umsýsla & Stjórnun', 'Administration', 'clipboard-list', 'teal', true),
('Sorpmeðhöndlun', 'Waste Management', 'recycle', 'lime', true),
('Pípulagnir', 'Plumbing', 'pipette', 'cyan', true),
('Málning & Frágangsvinna', 'Painting', 'palette', 'pink', true),
('Lóðaleiga / Fasteignagjöld', 'Land Lease / Property Tax', 'home', 'stone', true),
('Sameign & Sameiginlegur kostnaður', 'Common Expenses', 'building', 'sky', true),
('Annað', 'Other', 'help-circle', 'neutral', true),
('Óflokkað', 'Uncategorized', 'alert-triangle', 'yellow', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. VENDORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kennitala TEXT,
  type TEXT DEFAULT 'company' CHECK (type IN ('company','individual')),
  default_category_id UUID REFERENCES public.categories(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON public.vendors(name);

-- ============================================================
-- 5. VENDOR_RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendor_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_pattern TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  is_global BOOLEAN DEFAULT false,
  association_id UUID REFERENCES public.associations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vendor_rules_keyword_pattern ON public.vendor_rules(keyword_pattern);
CREATE INDEX IF NOT EXISTS idx_vendor_rules_association_id ON public.vendor_rules(association_id);
CREATE INDEX IF NOT EXISTS idx_vendor_rules_is_global ON public.vendor_rules(is_global);

-- ============================================================
-- 6. UPLOAD_BATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT,
  file_type TEXT DEFAULT 'paste' CHECK (file_type IN ('csv','xlsx','paste')),
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upload_batches_association_id ON public.upload_batches(association_id);

-- ============================================================
-- 7. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance DECIMAL(15,2),
  category_id UUID REFERENCES public.categories(id),
  is_income BOOLEAN DEFAULT false,
  is_individual_payment BOOLEAN DEFAULT false,
  vendor_id UUID REFERENCES public.vendors(id),
  original_description TEXT,
  manually_categorized BOOLEAN DEFAULT false,
  categorized_by_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_batch_id UUID REFERENCES public.upload_batches(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_association_date ON public.transactions(association_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_association_id ON public.transactions(association_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_is_income ON public.transactions(is_income);
CREATE INDEX IF NOT EXISTS idx_transactions_uploaded_batch_id ON public.transactions(uploaded_batch_id);

-- ============================================================
-- 8. SERVICE_PROVIDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  kennitala TEXT,
  description_is TEXT,
  description_en TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  service_area JSONB DEFAULT '[]',
  is_approved BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER handle_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. SERVICE_PROVIDER_CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_provider_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id)
);

CREATE INDEX IF NOT EXISTS idx_spc_provider_id ON public.service_provider_categories(provider_id);
CREATE INDEX IF NOT EXISTS idx_spc_category_id ON public.service_provider_categories(category_id);

-- ============================================================
-- 10. BID_REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bid_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','awarded','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER handle_bid_requests_updated_at
  BEFORE UPDATE ON public.bid_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bid_requests_association_id ON public.bid_requests(association_id);
CREATE INDEX IF NOT EXISTS idx_bid_requests_status ON public.bid_requests(status);

-- ============================================================
-- 11. BIDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_request_id UUID NOT NULL REFERENCES public.bid_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  valid_until TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER handle_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bids_bid_request_id ON public.bids(bid_request_id);
CREATE INDEX IF NOT EXISTS idx_bids_provider_id ON public.bids(provider_id);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- ============================================================
-- 13. AUDIT_LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  association_id UUID REFERENCES public.associations(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_association_id ON public.audit_log(association_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_association_member(assoc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.association_members
    WHERE association_id = assoc_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_association_admin(assoc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.association_members
    WHERE association_id = assoc_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'board')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ASSOCIATIONS
CREATE POLICY "Members can view their associations"
  ON public.associations FOR SELECT
  USING (public.is_association_member(id));

CREATE POLICY "Admins can update their associations"
  ON public.associations FOR UPDATE
  USING (public.is_association_admin(id));

CREATE POLICY "Authenticated users can create associations"
  ON public.associations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ASSOCIATION_MEMBERS
CREATE POLICY "Members can view memberships in their association"
  ON public.association_members FOR SELECT
  USING (public.is_association_member(association_id) OR user_id = auth.uid());

CREATE POLICY "Users can create their own membership"
  ON public.association_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage members"
  ON public.association_members FOR UPDATE
  USING (public.is_association_admin(association_id));

CREATE POLICY "Admins can delete members"
  ON public.association_members FOR DELETE
  USING (public.is_association_admin(association_id));

-- CATEGORIES (readable by all authenticated)
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- VENDORS (readable by all authenticated)
CREATE POLICY "Authenticated users can view vendors"
  ON public.vendors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- VENDOR_RULES
CREATE POLICY "Members can view vendor rules for their association"
  ON public.vendor_rules FOR SELECT
  USING (
    is_global = true
    OR (association_id IS NOT NULL AND public.is_association_member(association_id))
  );

CREATE POLICY "Admins can manage association vendor rules"
  ON public.vendor_rules FOR ALL
  USING (
    is_global = false
    AND association_id IS NOT NULL
    AND public.is_association_admin(association_id)
  );

-- UPLOAD_BATCHES
CREATE POLICY "Members can view upload batches"
  ON public.upload_batches FOR SELECT
  USING (public.is_association_member(association_id));

CREATE POLICY "Admins can create upload batches"
  ON public.upload_batches FOR INSERT
  WITH CHECK (
    public.is_association_admin(association_id)
    AND uploaded_by = auth.uid()
  );

-- TRANSACTIONS
CREATE POLICY "Members can view their association transactions"
  ON public.transactions FOR SELECT
  USING (public.is_association_member(association_id));

CREATE POLICY "Admins can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.is_association_admin(association_id));

CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.is_association_admin(association_id));

CREATE POLICY "Admins can delete transactions"
  ON public.transactions FOR DELETE
  USING (public.is_association_admin(association_id));

-- SERVICE_PROVIDERS
CREATE POLICY "Anyone can view approved service providers"
  ON public.service_providers FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own provider profile"
  ON public.service_providers FOR ALL
  USING (user_id = auth.uid());

-- SERVICE_PROVIDER_CATEGORIES
CREATE POLICY "Authenticated users can view provider categories"
  ON public.service_provider_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Providers can manage their own categories"
  ON public.service_provider_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = provider_id AND sp.user_id = auth.uid()
    )
  );

-- BID_REQUESTS
CREATE POLICY "Members can view bid requests for their association"
  ON public.bid_requests FOR SELECT
  USING (public.is_association_member(association_id));

CREATE POLICY "Approved providers can view open bid requests"
  ON public.bid_requests FOR SELECT
  USING (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.user_id = auth.uid() AND sp.is_approved = true
    )
  );

CREATE POLICY "Admins can manage bid requests"
  ON public.bid_requests FOR ALL
  USING (public.is_association_admin(association_id));

-- BIDS
CREATE POLICY "Association members can view bids on their requests"
  ON public.bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bid_requests br
      WHERE br.id = bid_request_id
        AND public.is_association_member(br.association_id)
    )
  );

CREATE POLICY "Approved providers can submit bids"
  ON public.bids FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = provider_id AND sp.user_id = auth.uid() AND sp.is_approved = true
    )
  );

CREATE POLICY "Providers can manage their own bids"
  ON public.bids FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers sp
      WHERE sp.id = provider_id AND sp.user_id = auth.uid()
    )
  );

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- AUDIT_LOG
CREATE POLICY "Admins can view audit log for their association"
  ON public.audit_log FOR SELECT
  USING (
    (association_id IS NOT NULL AND public.is_association_admin(association_id))
    OR user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
