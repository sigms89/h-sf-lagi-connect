-- Fix typo in trigger function: role_id -> role_type
CREATE OR REPLACE FUNCTION public.prevent_role_type_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role_type IS DISTINCT FROM OLD.role_type AND OLD.user_id = auth.uid() THEN
    IF OLD.role_type = 'super_admin' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Users cannot change their own role_type';
  END IF;
  RETURN NEW;
END;
$function$;