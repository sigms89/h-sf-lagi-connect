
-- Fix: ALL policies on associations and association_members are RESTRICTIVE 
-- but there are NO permissive policies. Restrictive-only = always denied.
-- Solution: recreate them as PERMISSIVE.

-- === associations ===
DROP POLICY IF EXISTS "Authenticated users can create associations" ON public.associations;
DROP POLICY IF EXISTS "Members can view their associations" ON public.associations;
DROP POLICY IF EXISTS "Admins can update their associations" ON public.associations;

CREATE POLICY "Authenticated users can create associations"
ON public.associations FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Members can view their associations"
ON public.associations FOR SELECT TO authenticated
USING (is_association_member(id));

CREATE POLICY "Admins can update their associations"
ON public.associations FOR UPDATE TO authenticated
USING (is_association_admin(id));

-- === association_members ===
DROP POLICY IF EXISTS "Users can create their own membership" ON public.association_members;
DROP POLICY IF EXISTS "Members can view memberships in their association" ON public.association_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.association_members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.association_members;

CREATE POLICY "Users can create their own membership"
ON public.association_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can view memberships in their association"
ON public.association_members FOR SELECT TO authenticated
USING (is_association_member(association_id) OR user_id = auth.uid());

CREATE POLICY "Admins can manage members"
ON public.association_members FOR UPDATE TO authenticated
USING (is_association_admin(association_id));

CREATE POLICY "Admins can delete members"
ON public.association_members FOR DELETE TO authenticated
USING (is_association_admin(association_id));
