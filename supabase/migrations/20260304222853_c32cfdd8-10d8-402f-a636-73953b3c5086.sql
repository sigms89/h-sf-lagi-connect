
-- Add RLS policies for admin CRUD on categories
-- Super admins need INSERT, UPDATE, DELETE access

-- Allow authenticated users to insert categories (admin check done in app layer)
CREATE POLICY "Authenticated users can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update categories
CREATE POLICY "Authenticated users can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete categories
CREATE POLICY "Authenticated users can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);
