alter table public.app_settings
  add column if not exists deposit_min_amount numeric not null default 1000,
  add column if not exists deposit_max_amount numeric not null default 10000000;

update public.app_settings
set deposit_min_amount = coalesce(deposit_min_amount, 1000),
    deposit_max_amount = coalesce(deposit_max_amount, 10000000);

create or replace function public.reload_schema_cache()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin access required';
  end if;
  perform pg_notify('pgrst', 'reload schema');
end;
$$;

revoke all on function public.reload_schema_cache() from public, anon;
grant execute on function public.reload_schema_cache() to authenticated;

notify pgrst, 'reload schema';
