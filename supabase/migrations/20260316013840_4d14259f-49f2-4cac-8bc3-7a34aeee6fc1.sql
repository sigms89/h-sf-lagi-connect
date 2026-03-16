
-- 1. Update any existing 'in_progress' rows to 'waiting'
UPDATE public.tasks SET status = 'waiting' WHERE status = 'in_progress';

-- 2. Add CHECK constraint on status
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('open', 'waiting', 'done'));

-- 3. Add new columns to tasks
ALTER TABLE public.tasks ADD COLUMN created_by uuid REFERENCES public.profiles(user_id);
ALTER TABLE public.tasks ADD COLUMN visibility text NOT NULL DEFAULT 'all';
ALTER TABLE public.tasks ADD CONSTRAINT tasks_visibility_check CHECK (visibility IN ('all', 'board'));
ALTER TABLE public.tasks ADD COLUMN current_stage integer;
ALTER TABLE public.tasks ADD COLUMN total_stages integer;

-- 4. Update SELECT RLS on tasks: board-only tasks visible only to admins
DROP POLICY IF EXISTS "Members can view tasks" ON public.tasks;
CREATE POLICY "Members can view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    is_association_member(association_id)
    AND (
      visibility = 'all'
      OR is_association_admin(association_id)
    )
  );

-- 5. Create task_comments table
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  content text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS on task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: association members can view comments on tasks they can see
CREATE POLICY "Members can view task comments" ON public.task_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
        AND is_association_member(t.association_id)
        AND (t.visibility = 'all' OR is_association_admin(t.association_id))
    )
  );

-- INSERT: association members can add comments
CREATE POLICY "Members can insert task comments" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
        AND is_association_member(t.association_id)
    )
  );

-- UPDATE: only comment author
CREATE POLICY "Authors can update their comments" ON public.task_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- DELETE: only comment author
CREATE POLICY "Authors can delete their comments" ON public.task_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
