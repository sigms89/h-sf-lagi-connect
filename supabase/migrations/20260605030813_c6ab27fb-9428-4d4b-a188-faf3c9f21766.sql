CREATE OR REPLACE FUNCTION public.accept_handover_invitation(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _inv public.handover_invitations%ROWTYPE;
  _uid UUID := auth.uid();
  _assoc_name TEXT;
  _new_name TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Notandi ekki innskráður';
  END IF;

  SELECT * INTO _inv FROM public.handover_invitations
    WHERE token = _token
    LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Boð fannst ekki';
  END IF;

  IF _inv.status = 'accepted' THEN
    RETURN jsonb_build_object('association_id', _inv.association_id, 'already', true);
  END IF;

  IF _inv.expires_at < now() THEN
    RAISE EXCEPTION 'Boðið er útrunnið';
  END IF;

  INSERT INTO public.association_members (association_id, user_id, role, is_active)
  VALUES (_inv.association_id, _uid, _inv.role, true)
  ON CONFLICT (association_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, is_active = true;

  UPDATE public.handover_invitations
    SET status = 'accepted', accepted_at = now(), accepted_by = _uid
    WHERE id = _inv.id;

  -- Notify the outgoing chairman
  SELECT name INTO _assoc_name FROM public.associations WHERE id = _inv.association_id;
  SELECT COALESCE(full_name, _inv.invitee_name) INTO _new_name FROM public.profiles WHERE user_id = _uid;

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (
    _inv.invited_by,
    'handover_accepted',
    _new_name || ' tók við',
    _new_name || ' hefur tekið við ' || COALESCE(_assoc_name, 'húsfélaginu') || '. Takk fyrir þinn tíma í stjórn.',
    'handover_invitation',
    _inv.id
  );

  RETURN jsonb_build_object('association_id', _inv.association_id, 'already', false);
END;
$function$;