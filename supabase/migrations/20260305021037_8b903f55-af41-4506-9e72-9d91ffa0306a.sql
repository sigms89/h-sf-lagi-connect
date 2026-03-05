
-- Add DELETE policy on upload_batches for admins
CREATE POLICY "Admins can delete upload batches"
ON public.upload_batches
FOR DELETE
TO authenticated
USING (is_association_admin(association_id));

-- Add UPDATE policy on upload_batches for admins
CREATE POLICY "Admins can update upload batches"
ON public.upload_batches
FOR UPDATE
TO authenticated
USING (is_association_admin(association_id));
