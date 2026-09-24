-- Security hardening: enable RLS on exposed public tables and remove permissive allow_all policies.
-- Existing purpose-specific policies remain unchanged.
begin;

alter table public.app_settings enable row level security;
alter table public.email_logs enable row level security;
alter table public.email_templates enable row level security;
alter table public.investments enable row level security;
alter table public.mm_messages enable row level security;
alter table public.payment_methods enable row level security;
alter table public.plans enable row level security;
alter table public.push_broadcasts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.receipt_email_queue enable row level security;
alter table public.user_roles enable row level security;
alter table public.withdrawals enable row level security;

drop policy if exists allow_all on public.app_settings;
drop policy if exists allow_all on public.email_logs;
drop policy if exists allow_all on public.email_templates;
drop policy if exists allow_all on public.investments;
drop policy if exists allow_all on public.mm_messages;
drop policy if exists allow_all on public.payment_methods;
drop policy if exists allow_all on public.plans;
drop policy if exists allow_all on public.push_broadcasts;
drop policy if exists allow_all on public.push_subscriptions;
drop policy if exists allow_all on public.receipt_email_queue;
drop policy if exists allow_all on public.user_roles;
drop policy if exists allow_all on public.withdrawals;

commit;
