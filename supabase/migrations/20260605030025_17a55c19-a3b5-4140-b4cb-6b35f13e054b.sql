
CREATE TABLE public.handover_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invited_by_name TEXT,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  personal_message TEXT,
  handover_date DATE,
  role TEXT NOT NULL DEFAULT 'board',
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_handover_invitations_token ON public.handover_invitations(token);
CREATE INDEX idx_handover_invitations_association ON public.handover_invitations(association_id);

GRANT SELECT ON public.handover_invitations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.handover_invitations TO authenticated;
GRANT ALL ON public.handover_invitations TO service_role;

ALTER TABLE public.handover_invitations ENABLE ROW LEVEL SECURITY;

-- Anyone with the token can read (validated by token in app); also association members can see their own
CREATE POLICY "Public can view invitations by token"
  ON public.handover_invitations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Board members can create invitations"
  ON public.handover_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND public.is_association_admin(association_id)
  );

CREATE POLICY "Inviter or accepter can update"
  ON public.handover_invitations FOR UPDATE
  TO authenticated
  USING (invited_by = auth.uid() OR accepted_by = auth.uid() OR status = 'pending')
  WITH CHECK (true);

CREATE TRIGGER update_handover_invitations_updated_at
  BEFORE UPDATE ON public.handover_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: accept invitation - creates association_members row for current user
CREATE OR REPLACE FUNCTION public.accept_handover_invitation(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.handover_invitations%ROWTYPE;
  _uid UUID := auth.uid();
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

  -- Add as member if not already
  INSERT INTO public.association_members (association_id, user_id, role, is_active)
  VALUES (_inv.association_id, _uid, _inv.role, true)
  ON CONFLICT (association_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, is_active = true;

  UPDATE public.handover_invitations
    SET status = 'accepted', accepted_at = now(), accepted_by = _uid
    WHERE id = _inv.id;

  RETURN jsonb_build_object('association_id', _inv.association_id, 'already', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_handover_invitation(TEXT) TO authenticated;
