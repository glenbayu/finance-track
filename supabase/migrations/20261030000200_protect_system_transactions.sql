-- System-generated rollover and admin-fee transactions are maintained by the
-- recalculation RPC. Authenticated users may read them, but must not edit or
-- delete them through ordinary table writes.

create or replace function public.protect_transaction_system_key()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user <> 'postgres' then
    if tg_op = 'INSERT' and new.system_key is not null then
      raise exception 'system_key is reserved for internal rollover processing.';
    end if;

    if tg_op = 'UPDATE' and old.system_key is not null then
      if new.user_id is distinct from old.user_id
        or new.type is distinct from old.type
        or new.amount is distinct from old.amount
        or new.wallet_id is distinct from old.wallet_id
        or new.destination_wallet_id is distinct from old.destination_wallet_id
        or new.category_id is distinct from old.category_id
        or new.note is distinct from old.note
        or new.transaction_date is distinct from old.transaction_date
        or new.system_key is distinct from old.system_key
      then
        raise exception 'System-generated transactions cannot be edited by users.';
      end if;
    elsif tg_op = 'UPDATE' and new.system_key is distinct from old.system_key then
      raise exception 'system_key is reserved for internal rollover processing.';
    end if;

    if tg_op = 'DELETE' and old.system_key is not null then
      raise exception 'System-generated transactions cannot be deleted by users.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_protect_system_key on public.transactions;
create trigger transactions_protect_system_key
before insert or update or delete on public.transactions
for each row
execute function public.protect_transaction_system_key();
