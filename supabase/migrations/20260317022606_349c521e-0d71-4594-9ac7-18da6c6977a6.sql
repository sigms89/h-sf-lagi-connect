-- Fix D2: Allow association members to see each other's profiles
CREATE POLICY "Association members can view co-member profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_members am1
      JOIN public.association_members am2 ON am1.association_id = am2.association_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = profiles.user_id
        AND am1.is_active = true
        AND am2.is_active = true
    )
  );

-- Fix C4: Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Fix A1: Update trigger to allow super_admin to change any role
CREATE OR REPLACE FUNCTION public.prevent_role_type_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role_type IS DISTINCT FROM OLD.role_id AND OLD.user_id = auth.uid() THEN
    IF OLD.role_type = 'super_admin' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Users cannot change their own role_type';
  END IF;
  RETURN NEW;
END;
$function$;