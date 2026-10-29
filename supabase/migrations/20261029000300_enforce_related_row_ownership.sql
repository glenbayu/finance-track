-- Enforce ownership of referenced rows at the database layer.
-- This migration deliberately fails on legacy inconsistent rows; it does not
-- rewrite or delete finance history automatically.

do $$
begin
  if exists (
    select 1
    from public.transactions t
    left join public.wallets source_wallet on source_wallet.id = t.wallet_id
    left join public.wallets destination_wallet on destination_wallet.id = t.destination_wallet_id
    left join public.categories c on c.id = t.category_id
    where t.wallet_id is null
      or source_wallet.id is null
      or source_wallet.user_id is distinct from t.user_id
      or (
        t.destination_wallet_id is not null
        and (
          destination_wallet.id is null
          or destination_wallet.user_id is distinct from t.user_id
        )
      )
      or (
        t.type = 'transfer'
        and (
          t.destination_wallet_id is null
          or t.destination_wallet_id = t.wallet_id
        )
      )
      or (t.type <> 'transfer' and t.destination_wallet_id is not null)
      or (
        t.type in ('income', 'expense')
        and t.category_id is not null
        and (
          c.id is null
          or (c.user_id is not null and c.user_id is distinct from t.user_id)
          or c.type is distinct from t.type
        )
      )
      or (t.type in ('transfer', 'adjustment') and t.category_id is not null)
  ) then
    raise exception
      'Ownership migration stopped: transactions contain invalid wallet/category references or inconsistent transfer fields. Reconcile the listed rows before retrying.';
  end if;

  if exists (
    select 1
    from public.budgets b
    left join public.categories c on c.id = b.category_id
    where c.id is null
      or c.type is distinct from 'expense'
      or (c.user_id is not null and c.user_id is distinct from b.user_id)
  ) then
    raise exception
      'Ownership migration stopped: budgets contain categories that are not expense categories owned by the same user or shared defaults. Reconcile these rows before retrying.';
  end if;

  if exists (
    select 1
    from public.quick_add_templates t
    left join public.categories c on c.id = t.category_id
    where t.category_id is not null
      and (
        c.id is null
        or c.type is distinct from t.type
        or (c.user_id is not null and c.user_id is distinct from t.user_id)
      )
  ) then
    raise exception
      'Ownership migration stopped: quick-add templates contain invalid or cross-user categories. Reconcile these rows before retrying.';
  end if;
end
$$;

create or replace function public.enforce_transaction_related_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_wallet_user_id uuid;
  v_category_user_id uuid;
  v_category_type text;
begin
  if new.wallet_id is null then
    raise exception 'A transaction must reference one of your own wallets.';
  end if;

  select w.user_id into v_wallet_user_id
  from public.wallets w
  where w.id = new.wallet_id;

  if not found or v_wallet_user_id is distinct from new.user_id then
    raise exception 'The source wallet must belong to the transaction owner.';
  end if;

  if new.type = 'transfer' then
    if new.destination_wallet_id is null or new.destination_wallet_id = new.wallet_id then
      raise exception 'A transfer requires two different wallets.';
    end if;

    select w.user_id into v_wallet_user_id
    from public.wallets w
    where w.id = new.destination_wallet_id;

    if not found or v_wallet_user_id is distinct from new.user_id then
      raise exception 'The destination wallet must belong to the transaction owner.';
    end if;
  elsif new.destination_wallet_id is not null then
    raise exception 'Only transfers may reference a destination wallet.';
  end if;

  if new.type in ('income', 'expense') then
    if new.category_id is not null then
      select c.user_id, c.type
      into v_category_user_id, v_category_type
      from public.categories c
      where c.id = new.category_id;

      if not found then
        raise exception 'The category does not exist or is not visible to this user.';
      end if;

      if v_category_user_id is not null and v_category_user_id is distinct from new.user_id then
        raise exception 'The category must belong to the transaction owner or be a shared default.';
      end if;

      if v_category_type is distinct from new.type then
        raise exception 'The category type must match the transaction type.';
      end if;
    end if;
  elsif new.category_id is not null then
    raise exception 'Transfers and balance adjustments cannot reference a category.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_budget_category_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_category_user_id uuid;
  v_category_type text;
begin
  select c.user_id, c.type
  into v_category_user_id, v_category_type
  from public.categories c
  where c.id = new.category_id;

  if not found then
    raise exception 'The budget category does not exist or is not visible to this user.';
  end if;

  if v_category_user_id is not null and v_category_user_id is distinct from new.user_id then
    raise exception 'A budget category must belong to the budget owner or be a shared default.';
  end if;

  if v_category_type is distinct from 'expense' then
    raise exception 'Budgets may only reference expense categories.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_template_category_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_category_user_id uuid;
  v_category_type text;
begin
  if new.category_id is null then
    return new;
  end if;

  select c.user_id, c.type
  into v_category_user_id, v_category_type
  from public.categories c
  where c.id = new.category_id;

  if not found then
    raise exception 'The template category does not exist or is not visible to this user.';
  end if;

  if v_category_user_id is not null and v_category_user_id is distinct from new.user_id then
    raise exception 'A template category must belong to the template owner or be a shared default.';
  end if;

  if v_category_type is distinct from new.type then
    raise exception 'The category type must match the template type.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_referenced_category_type_change()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $
begin
  if new.type is distinct from old.type then
    if exists (
      select 1 from public.transactions t
      where t.category_id = old.id
    ) then
      raise exception 'A category type cannot change while transactions reference it.';
    end if;

    if exists (
      select 1 from public.budgets b
      where b.category_id = old.id
    ) then
      raise exception 'A category type cannot change while budgets reference it.';
    end if;

    if exists (
      select 1 from public.quick_add_templates t
      where t.category_id = old.id
    ) then
      raise exception 'A category type cannot change while quick-add templates reference it.';
    end if;
  end if;

  return new;
end;
$;

drop trigger if exists categories_prevent_referenced_type_change on public.categories;
create trigger categories_prevent_referenced_type_change
before update of type on public.categories
for each row
execute function public.prevent_referenced_category_type_change();

drop trigger if exists transactions_enforce_related_ownership on public.transactions;
create trigger transactions_enforce_related_ownership
before insert or update on public.transactions
for each row
execute function public.enforce_transaction_related_ownership();

drop trigger if exists budgets_enforce_category_ownership on public.budgets;
create trigger budgets_enforce_category_ownership
before insert or update on public.budgets
for each row
execute function public.enforce_budget_category_ownership();

drop trigger if exists quick_add_templates_enforce_category_ownership on public.quick_add_templates;
create trigger quick_add_templates_enforce_category_ownership
before insert or update on public.quick_add_templates
for each row
execute function public.enforce_template_category_ownership();
