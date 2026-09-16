
-- Restrict trigger function (only invoked by trigger system)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role must be callable by authenticated for RLS to evaluate; revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Replace broad bucket SELECT with scoped policy: owners + admins only
DROP POLICY IF EXISTS "Anyone view proofs" ON storage.objects;
CREATE POLICY "Owners and admins view proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';
