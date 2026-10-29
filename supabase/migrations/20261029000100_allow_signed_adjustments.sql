-- Allow signed balance corrections while keeping other transaction amounts positive.
-- The magnitude of an adjustment is its signed effect on the wallet balance.
alter table public.transactions
  drop constraint if exists transactions_amount_check;

alter table public.transactions
  add constraint transactions_amount_positive_unless_adjustment
  check (
    (type = 'adjustment' and amount <> 0)
    or (type <> 'adjustment' and amount > 0)
  );
