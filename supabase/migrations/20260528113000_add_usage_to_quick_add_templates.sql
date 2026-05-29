alter table public.quick_add_templates
  add column if not exists use_count integer not null default 0;

alter table public.quick_add_templates
  add column if not exists last_used_at timestamptz null;

create index if not exists quick_add_templates_user_use_count_idx
  on public.quick_add_templates (user_id, use_count desc);

create index if not exists quick_add_templates_user_last_used_idx
  on public.quick_add_templates (user_id, last_used_at desc);
