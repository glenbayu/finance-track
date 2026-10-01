-- Migration: Automatically create default wallet and initial categories when a new user signs up
create or replace function public.handle_new_user_setup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_wallet_id uuid;
begin
  -- 1. Create default wallet 'Dompet Utama (Cash)'
  insert into public.wallets (user_id, name, type, is_rollover_enabled, admin_fee_amount)
  values (new.id, 'Dompet Utama (Cash)', 'cash', true, 0)
  returning id into default_wallet_id;

  -- 2. Create standard starter categories for this user
  insert into public.categories (user_id, name, type) values
    -- Income
    (new.id, 'Gaji', 'income'),
    (new.id, 'Bonus', 'income'),
    (new.id, 'Investasi', 'income'),
    (new.id, 'Lain-lain', 'income'),
    -- Expense
    (new.id, 'Makanan & Minuman', 'expense'),
    (new.id, 'Transportasi', 'expense'),
    (new.id, 'Tagihan & Langganan', 'expense'),
    (new.id, 'Belanja', 'expense'),
    (new.id, 'Kesehatan', 'expense'),
    (new.id, 'Defisit / Lain-lain', 'expense');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_setup on auth.users;

create trigger on_auth_user_created_setup
  after insert on auth.users
  for each row execute function public.handle_new_user_setup();
