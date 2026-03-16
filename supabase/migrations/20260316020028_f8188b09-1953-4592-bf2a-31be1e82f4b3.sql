ALTER TABLE public.tasks ADD COLUMN source text DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN related_entity_id uuid DEFAULT NULL;