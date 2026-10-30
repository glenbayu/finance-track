-- Reject archived categories when assigning a new relationship.
-- Existing historical relationships remain readable and editable when the
-- category reference itself is not changed.

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
  v_category_archived_at timestamptz;
  v_category_reference_changed boolean;
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
      select c.user_id, c.type, c.archived_at
      into v_category_user_id, v_category_type, v_category_archived_at
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

      if tg_op = 'INSERT' then
        v_category_reference_changed := true;
      else
        v_category_reference_changed := new.category_id is distinct from old.category_id;
      end if;

      if v_category_archived_at is not null and v_category_reference_changed then
        raise exception 'Archived categories cannot be assigned to new transactions.';
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
  v_category_archived_at timestamptz;
  v_category_reference_changed boolean;
begin
  select c.user_id, c.type, c.archived_at
  into v_category_user_id, v_category_type, v_category_archived_at
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

  if tg_op = 'INSERT' then
    v_category_reference_changed := true;
  else
    v_category_reference_changed := new.category_id is distinct from old.category_id;
  end if;

  if v_category_archived_at is not null and v_category_reference_changed then
    raise exception 'Archived categories cannot be assigned to budgets.';
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
  v_category_archived_at timestamptz;
  v_category_reference_changed boolean;
begin
  if new.category_id is null then
    return new;
  end if;

  select c.user_id, c.type, c.archived_at
  into v_category_user_id, v_category_type, v_category_archived_at
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

  if tg_op = 'INSERT' then
    v_category_reference_changed := true;
  else
    v_category_reference_changed := new.category_id is distinct from old.category_id;
  end if;

  if v_category_archived_at is not null and v_category_reference_changed then
    raise exception 'Archived categories cannot be assigned to quick-add templates.';
  end if;

  return new;
end;
$$;
