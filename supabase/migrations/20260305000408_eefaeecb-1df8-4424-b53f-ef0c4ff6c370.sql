
-- 1. Insert new system categories
INSERT INTO public.categories (name_is, name_en, icon, color, is_system) VALUES
  ('Bankakostnaður',    'Bank Fees',       'landmark', 'rose',    true),
  ('Innheimtukostnaður','Collection Fees', 'receipt',  'fuchsia', true)
ON CONFLICT DO NOTHING;

-- 2. Index on transactions(description) to speed up vendor grouping queries
CREATE INDEX IF NOT EXISTS idx_transactions_description
  ON public.transactions (description);

-- 3. Composite index on (association_id, description) for per-association vendor queries
CREATE INDEX IF NOT EXISTS idx_transactions_assoc_description
  ON public.transactions (association_id, description);

-- 4. Index on (association_id, category_id) for uncategorized filter performance
CREATE INDEX IF NOT EXISTS idx_transactions_assoc_category
  ON public.transactions (association_id, category_id);
