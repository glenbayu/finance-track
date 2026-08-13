-- Add rollover customization columns to wallets
alter table public.wallets
    add column is_rollover_enabled boolean not null default false,
    add column admin_fee_amount numeric not null default 0;

-- Optional: For existing bank wallets, we might want to set is_rollover_enabled = true 
-- and admin_fee_amount = 6000 to preserve legacy behavior.
-- We will assume users can turn them on manually, but for seamless transition:
update public.wallets
set is_rollover_enabled = true,
    admin_fee_amount = 6000
where type = 'bank';