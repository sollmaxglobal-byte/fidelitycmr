create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null,
  account_name text not null,
  account_number text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payout_accounts enable row level security;

drop policy if exists "payout_accounts_select_own" on public.payout_accounts;
drop policy if exists "payout_accounts_insert_own" on public.payout_accounts;
drop policy if exists "payout_accounts_update_own" on public.payout_accounts;
drop policy if exists "payout_accounts_delete_own" on public.payout_accounts;

create policy "payout_accounts_select_own" on public.payout_accounts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "payout_accounts_insert_own" on public.payout_accounts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "payout_accounts_update_own" on public.payout_accounts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "payout_accounts_delete_own" on public.payout_accounts
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.payout_accounts to authenticated;
notify pgrst, 'reload schema';

alter table public.app_settings
  add column if not exists deposit_min_amount numeric not null default 1000,
  add column if not exists deposit_max_amount numeric not null default 10000000;
notify pgrst, 'reload schema';

-- Verification: both referenced deposit-limit columns and payout_accounts are migration-owned.
select to_regclass('public.payout_accounts');
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'app_settings'
  and column_name in ('deposit_min_amount', 'deposit_max_amount');

-- Keep this migration idempotent for databases where the columns were already added manually.
-- The live database migration is applied separately through the Supabase MCP.
