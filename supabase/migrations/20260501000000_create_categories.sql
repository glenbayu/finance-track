-- Migration: Master definition for public.categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to auto-update updated_at timestamp
create or replace function public.set_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_categories_updated_at();

-- RLS policies
alter table public.categories enable row level security;

drop policy if exists "Users can view own or default categories" on public.categories;
create policy "Users can view own or default categories"
  on public.categories for select
  to authenticated
  using (user_id = auth.uid() or user_id is null);

drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories"
  on public.categories for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories"
  on public.categories for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories"
  on public.categories for delete
  to authenticated
  using (user_id = auth.uid());

-- Indexes
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists categories_user_archived_idx on public.categories(user_id, archived_at);
create index if not exists categories_type_archived_idx on public.categories(type, archived_at);
