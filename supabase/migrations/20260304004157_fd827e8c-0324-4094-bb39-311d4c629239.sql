
-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can create associations" ON public.associations;

CREATE POLICY "Authenticated users can create associations"
ON public.associations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix SELECT so users can see their new association immediately
DROP POLICY IF EXISTS "Members can view their associations" ON public.associations;

CREATE POLICY "Members can view their associations"
ON public.associations
FOR SELECT
TO authenticated
USING (is_association_member(id));

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Admins can update their associations" ON public.associations;

CREATE POLICY "Admins can update their associations"
ON public.associations
FOR UPDATE
TO authenticated
USING (is_association_admin(id));
