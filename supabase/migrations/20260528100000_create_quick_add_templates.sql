create table if not exists public.quick_add_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid null references public.categories(id) on delete set null,
  amount numeric null check (amount is null or amount > 0),
  note text null,
  icon text null,
  color text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quick_add_templates_user_id_idx
  on public.quick_add_templates (user_id);

create index if not exists quick_add_templates_user_active_idx
  on public.quick_add_templates (user_id, is_active);

create index if not exists quick_add_templates_user_sort_idx
  on public.quick_add_templates (user_id, sort_order);

create or replace function public.set_quick_add_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quick_add_templates_set_updated_at on public.quick_add_templates;

create trigger quick_add_templates_set_updated_at
before update on public.quick_add_templates
for each row
execute function public.set_quick_add_templates_updated_at();

alter table public.quick_add_templates enable row level security;

drop policy if exists "quick_add_templates_select_own" on public.quick_add_templates;
create policy "quick_add_templates_select_own"
on public.quick_add_templates
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "quick_add_templates_insert_own" on public.quick_add_templates;
create policy "quick_add_templates_insert_own"
on public.quick_add_templates
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "quick_add_templates_update_own" on public.quick_add_templates;
create policy "quick_add_templates_update_own"
on public.quick_add_templates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "quick_add_templates_delete_own" on public.quick_add_templates;
create policy "quick_add_templates_delete_own"
on public.quick_add_templates
for delete
to authenticated
using (auth.uid() = user_id);
