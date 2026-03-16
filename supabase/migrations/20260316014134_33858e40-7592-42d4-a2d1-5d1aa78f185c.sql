
ALTER TABLE public.tasks ADD COLUMN due_date date;
ALTER TABLE public.tasks ADD COLUMN assigned_to uuid REFERENCES public.profiles(user_id);
