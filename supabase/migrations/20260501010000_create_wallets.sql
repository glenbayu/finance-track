-- Migration: Master definition for public.wallets
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'cash',
  is_rollover_enabled boolean not null default true,
  admin_fee_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to auto-update updated_at timestamp
create or replace function public.set_wallets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at
before update on public.wallets
for each row
execute function public.set_wallets_updated_at();

-- RLS policies
alter table public.wallets enable row level security;

drop policy if exists "Users can view their own wallets" on public.wallets;
create policy "Users can view their own wallets"
  on public.wallets for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own wallets" on public.wallets;
create policy "Users can insert their own wallets"
  on public.wallets for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own wallets" on public.wallets;
create policy "Users can update their own wallets"
  on public.wallets for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own wallets" on public.wallets;
create policy "Users can delete their own wallets"
  on public.wallets for delete
  to authenticated
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_wallets_user on public.wallets(user_id);
