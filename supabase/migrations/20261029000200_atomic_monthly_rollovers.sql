-- Make monthly rollover recalculation atomic and idempotent.
-- Existing generated rows are tagged with stable keys. If the existing data has
-- ambiguous duplicates, abort instead of deleting or silently choosing a row.

do $$
begin
  if exists (
    select 1
    from public.transactions
    where type = 'expense'
      and note = 'Biaya Admin Rekening'
      and wallet_id is not null
    group by user_id, wallet_id, transaction_date
    having count(*) > 1
  ) then
    raise exception
      'Rollover migration stopped: duplicate Biaya Admin Rekening rows exist for the same user, wallet, and date. Reconcile these rows manually, then rerun the migration.';
  end if;

  if exists (
    select 1
    from public.transactions
    where type in ('income', 'expense')
      and note like '%(Rollover)%'
      and wallet_id is not null
    group by user_id, wallet_id, to_char(transaction_date, 'YYYY-MM')
    having count(*) > 1
  ) then
    raise exception
      'Rollover migration stopped: duplicate rollover rows exist for the same user, wallet, and month. Reconcile these rows manually, then rerun the migration.';
  end if;
end
$$;

alter table public.transactions
  add column if not exists system_key text;

update public.transactions
set system_key = 'admin_fee:' || transaction_date::text || ':' || wallet_id::text
where system_key is null
  and type = 'expense'
  and note = 'Biaya Admin Rekening'
  and wallet_id is not null;

update public.transactions
set system_key = 'rollover:' || to_char(transaction_date, 'YYYY-MM') || ':' || wallet_id::text
where system_key is null
  and type in ('income', 'expense')
  and note like '%(Rollover)%'
  and wallet_id is not null;

create unique index if not exists transactions_user_system_key_unique
  on public.transactions (user_id, system_key)
  where system_key is not null;

create or replace function public.recalculate_monthly_rollovers(p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_current_date date;
  v_current_month_start date;
  v_current_month text;
  v_previous_month_start date;
  v_previous_month_end date;
  v_created_before timestamptz;
  v_income_category_id uuid;
  v_expense_category_id uuid;
  v_admin_category_id uuid;
  v_wallet record;
  v_balance numeric;
  v_expected_type text;
  v_expected_amount numeric;
  v_expected_note text;
  v_expected_category_id uuid;
  v_system_key text;
  v_existing_count bigint;
begin
  if p_user_id is null or auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized to recalculate rollovers for this user'
      using errcode = '42501';
  end if;

  -- Serialize recalculations for the same user until this transaction commits.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 918273));

  v_current_date := timezone('Asia/Jakarta', now())::date;
  v_current_month_start := date_trunc('month', v_current_date)::date;
  v_current_month := to_char(v_current_month_start, 'YYYY-MM');
  v_previous_month_start := (v_current_month_start - interval '1 month')::date;
  v_previous_month_end := v_current_month_start - 1;
  v_created_before := v_current_month_start::timestamp at time zone 'Asia/Jakarta';

  select c.id into v_income_category_id
  from public.categories c
  where (c.user_id = p_user_id or c.user_id is null)
    and c.type = 'income'
    and lower(c.name) = 'bonus'
  order by (c.user_id is null)
  limit 1;

  select c.id into v_expense_category_id
  from public.categories c
  where (c.user_id = p_user_id or c.user_id is null)
    and c.type = 'expense'
    and lower(c.name) like '%defisit%'
  order by (c.user_id is null)
  limit 1;

  select c.id into v_admin_category_id
  from public.categories c
  where (c.user_id = p_user_id or c.user_id is null)
    and c.type = 'expense'
    and (
      lower(c.name) like '%tagihan%'
      or lower(c.name) like '%langganan%'
    )
  order by (c.user_id is null)
  limit 1;

  -- Generate missing admin fees only for wallets that existed before this month
  -- and have rollover/admin-fee enabled. Existing manually entered fee rows
  -- with the same canonical note/date are preserved and treated as already present.
  insert into public.transactions (
    user_id, type, amount, wallet_id, destination_wallet_id, note,
    transaction_date, category_id, system_key
  )
  select
    p_user_id,
    'expense',
    w.admin_fee_amount,
    w.id,
    null,
    'Biaya Admin Rekening',
    v_previous_month_end,
    v_admin_category_id,
    'admin_fee:' || v_previous_month_end::text || ':' || w.id::text
  from public.wallets w
  where w.user_id = p_user_id
    and w.created_at < v_created_before
    and w.is_rollover_enabled is true
    and coalesce(w.admin_fee_amount, 0) > 0
    and not exists (
      select 1
      from public.transactions t
      where t.user_id = p_user_id
        and t.wallet_id = w.id
        and t.transaction_date = v_previous_month_end
        and t.type = 'expense'
        and t.note = 'Biaya Admin Rekening'
    )
  on conflict (user_id, system_key) where system_key is not null do nothing;

  for v_wallet in
    select w.id, w.created_at, w.is_rollover_enabled
    from public.wallets w
    where w.user_id = p_user_id
      and w.created_at < v_created_before
  loop
    v_system_key := 'rollover:' || v_current_month || ':' || v_wallet.id::text;

    select count(*) into v_existing_count
    from public.transactions t
    where t.user_id = p_user_id
      and t.wallet_id = v_wallet.id
      and t.transaction_date = v_current_month_start
      and t.type in ('income', 'expense')
      and t.note in (
        'Sisa uang bulan kemarin (Rollover)',
        'Defisit uang bulan kemarin (Rollover)'
      );

    if v_existing_count > 1 then
      raise exception
        'Multiple rollover rows found for wallet % in %. Reconcile the rows manually before recalculating.',
        v_wallet.id, v_current_month;
    end if;

    -- Adopt a single legacy/manual row into the stable identity before reconciling.
    update public.transactions t
    set system_key = v_system_key
    where t.user_id = p_user_id
      and t.wallet_id = v_wallet.id
      and t.transaction_date = v_current_month_start
      and t.type in ('income', 'expense')
      and t.note in (
        'Sisa uang bulan kemarin (Rollover)',
        'Defisit uang bulan kemarin (Rollover)'
      )
      and t.system_key is null;

    if coalesce(v_wallet.is_rollover_enabled, false) is false then
      delete from public.transactions t
      where t.user_id = p_user_id
        and t.system_key = v_system_key;
      continue;
    end if;

    select coalesce(sum(
      case
        when t.type = 'transfer' and t.wallet_id = v_wallet.id then -t.amount
        when t.type = 'transfer' and t.destination_wallet_id = v_wallet.id then t.amount
        when t.wallet_id = v_wallet.id and t.type = 'income' then t.amount
        when t.wallet_id = v_wallet.id and t.type = 'expense' then -t.amount
        when t.wallet_id = v_wallet.id and t.type = 'adjustment' then t.amount
        else 0
      end
    ), 0)
    into v_balance
    from public.transactions t
    where t.user_id = p_user_id
      and t.transaction_date >= v_previous_month_start
      and t.transaction_date <= v_previous_month_end
      and (
        t.wallet_id = v_wallet.id
        or (t.type = 'transfer' and t.destination_wallet_id = v_wallet.id)
      );

    if v_balance = 0 then
      delete from public.transactions t
      where t.user_id = p_user_id
        and t.system_key = v_system_key;
      continue;
    end if;

    v_expected_type := case when v_balance > 0 then 'income' else 'expense' end;
    v_expected_amount := abs(v_balance);
    v_expected_note := case
      when v_balance > 0 then 'Sisa uang bulan kemarin (Rollover)'
      else 'Defisit uang bulan kemarin (Rollover)'
    end;
    v_expected_category_id := case
      when v_balance > 0 then v_income_category_id
      else v_expense_category_id
    end;

    insert into public.transactions (
      user_id, type, amount, wallet_id, destination_wallet_id, note,
      transaction_date, category_id, system_key
    )
    values (
      p_user_id, v_expected_type, v_expected_amount, v_wallet.id, null,
      v_expected_note, v_current_month_start, v_expected_category_id, v_system_key
    )
    on conflict (user_id, system_key) where system_key is not null
    do update set
      type = excluded.type,
      amount = excluded.amount,
      wallet_id = excluded.wallet_id,
      destination_wallet_id = null,
      note = excluded.note,
      transaction_date = excluded.transaction_date,
      category_id = excluded.category_id
    ;
  end loop;
end;
$$;

revoke all on function public.recalculate_monthly_rollovers(uuid) from public;
grant execute on function public.recalculate_monthly_rollovers(uuid) to authenticated;
