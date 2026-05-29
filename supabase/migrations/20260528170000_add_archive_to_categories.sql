alter table if exists public.categories
add column if not exists archived_at timestamptz null;

create index if not exists categories_user_archived_idx
on public.categories (user_id, archived_at);

create index if not exists categories_type_archived_idx
on public.categories (type, archived_at);
