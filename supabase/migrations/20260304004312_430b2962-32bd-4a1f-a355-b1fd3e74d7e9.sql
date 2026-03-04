
-- Force drop ALL policies on associations and recreate clean
DROP POLICY IF EXISTS "Authenticated users can create associations" ON public.associations;
DROP POLICY IF EXISTS "Members can view their associations" ON public.associations;
DROP POLICY IF EXISTS "Admins can update their associations" ON public.associations;

-- Recreate as permissive (default)
CREATE POLICY "Authenticated users can create associations"
ON public.associations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Members can view their associations"
ON public.associations
FOR SELECT
TO authenticated
USING (is_association_member(id));

CREATE POLICY "Admins can update their associations"
ON public.associations
FOR UPDATE
TO authenticated
USING (is_association_admin(id));
