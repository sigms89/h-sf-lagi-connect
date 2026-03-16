
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'info',
  category text,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (is_association_member(association_id));

CREATE POLICY "Admins can insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (is_association_admin(association_id));

CREATE POLICY "Admins can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (is_association_admin(association_id));

CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (is_association_admin(association_id));
