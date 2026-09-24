create table if not exists public.korapay_config (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  secret_key text,
  webhook_url text,
  updated_at timestamptz not null default now()
);

alter table public.korapay_config enable row level security;

drop policy if exists "Admins read korapay_config" on public.korapay_config;
drop policy if exists "Admins update korapay_config" on public.korapay_config;

create policy "Admins read korapay_config"
  on public.korapay_config for select to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins update korapay_config"
  on public.korapay_config for update to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

insert into public.korapay_config (id) values (1)
on conflict (id) do nothing;

create or replace function public.get_korapay_config_admin()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'enabled', enabled,
    'secret_key', secret_key,
    'webhook_url', webhook_url
  )
  from public.korapay_config
  where id = 1
    and has_role(auth.uid(), 'admin'::app_role);
$$;

revoke all on function public.get_korapay_config_admin() from public, anon;
grant execute on function public.get_korapay_config_admin() to authenticated;

create or replace function public.save_korapay_config_admin(
  p_enabled boolean,
  p_secret_key text,
  p_webhook_url text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin access required';
  end if;

  update public.korapay_config
  set enabled = coalesce(p_enabled, false),
      secret_key = nullif(trim(coalesce(p_secret_key, '')), ''),
      webhook_url = nullif(trim(coalesce(p_webhook_url, '')), ''),
      updated_at = now()
  where id = 1;

  return true;
end;
$$;

revoke all on function public.save_korapay_config_admin(boolean,text,text) from public, anon;
grant execute on function public.save_korapay_config_admin(boolean,text,text) to authenticated;

notify pgrst, 'reload schema';
