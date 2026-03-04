ALTER TABLE public.upload_batches DROP CONSTRAINT upload_batches_file_type_check;
ALTER TABLE public.upload_batches ADD CONSTRAINT upload_batches_file_type_check 
  CHECK (file_type = ANY (ARRAY['csv','xlsx','paste','json']));