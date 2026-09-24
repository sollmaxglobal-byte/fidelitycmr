alter table public.payment_methods add column if not exists provider text not null default 'manual';

update public.payment_methods
set provider = 'manual'
where provider is null or provider = '';

notify pgrst, 'reload schema';
