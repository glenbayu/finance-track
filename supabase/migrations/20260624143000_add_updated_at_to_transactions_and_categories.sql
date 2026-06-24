alter table if exists public.transactions
add column if not exists updated_at timestamptz;

update public.transactions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table if exists public.transactions
alter column updated_at set default now();

alter table if exists public.transactions
alter column updated_at set not null;

create or replace function public.set_transactions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_transactions_updated_at();

alter table if exists public.categories
add column if not exists updated_at timestamptz;

update public.categories
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table if exists public.categories
alter column updated_at set default now();

alter table if exists public.categories
alter column updated_at set not null;

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
