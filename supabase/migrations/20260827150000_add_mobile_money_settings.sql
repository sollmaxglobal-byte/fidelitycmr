alter table public.app_settings
  add column if not exists mtn_number text,
  add column if not exists orange_number text,
  add column if not exists mtn_enabled boolean not null default false,
  add column if not exists orange_enabled boolean not null default false;

notify pgrst, 'reload schema';
