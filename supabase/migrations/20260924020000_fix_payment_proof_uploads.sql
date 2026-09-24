begin;

-- Payment proof uploads were failing because the private bucket had no authenticated
-- user upload policy. Keep proofs private and scope access to the owner's user id.
drop policy if exists "Users upload own payment proofs" on storage.objects;
drop policy if exists "Users view own payment proofs" on storage.objects;
drop policy if exists "Users update own payment proofs" on storage.objects;

create policy "Users upload own payment proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users view own payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or has_role(auth.uid(), 'admin'::app_role)
  )
);

create policy "Users update own payment proofs"
on storage.objects for update to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- The deposit table already has authenticated-user ownership policies.
-- Remove the old public allow-all policies so deposit writes are governed by those policies.
drop policy if exists "allow all" on public.deposits;
drop policy if exists "allow_all" on public.deposits;

commit;
