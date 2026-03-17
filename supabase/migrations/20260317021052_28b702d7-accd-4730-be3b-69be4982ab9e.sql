-- C1/C2: Prevent users from updating their own role_type
-- Drop the existing overly-permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new UPDATE policy that excludes role_type changes
-- We use a trigger to enforce this since RLS can't restrict individual columns
CREATE OR REPLACE FUNCTION public.prevent_role_type_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role_type is being changed and the user is changing their own profile
  IF NEW.role_type IS DISTINCT FROM OLD.role_type AND OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot change their own role_type';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_type_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_type_self_update();

-- Re-create the UPDATE policy (same as before, but now the trigger guards role_type)
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- C3: Lock down categories to admin-only for mutations
-- First create a helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role_type = 'super_admin'
  )
$$;

-- Drop overly permissive policies on categories
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;

-- Replace with admin-only policies
CREATE POLICY "Only super_admin can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Only super_admin can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Only super_admin can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.is_super_admin());