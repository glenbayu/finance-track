-- Keep wallet values within the set supported by the application.
-- This protects direct authenticated API writes in addition to server validation.

do $$
begin
  if exists (
    select 1
    from public.wallets
    where type not in ('cash', 'bank', 'receivable')
  ) then
    raise exception
      'Wallet constraint migration stopped: unsupported wallet types exist. Reconcile these rows manually before retrying.';
  end if;

  if exists (
    select 1
    from public.wallets
    where admin_fee_amount < 0
      or admin_fee_amount = 'NaN'::numeric
  ) then
    raise exception
      'Wallet constraint migration stopped: negative or NaN admin fee amounts exist. Reconcile these rows manually before retrying.';
  end if;
end
$$;

alter table public.wallets
  drop constraint if exists wallets_type_check;

alter table public.wallets
  add constraint wallets_type_check
  check (type in ('cash', 'bank', 'receivable'));

alter table public.wallets
  drop constraint if exists wallets_admin_fee_amount_check;

alter table public.wallets
  add constraint wallets_admin_fee_amount_check
  check (admin_fee_amount >= 0 and admin_fee_amount <> 'NaN'::numeric);
