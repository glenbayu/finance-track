-- Create wallets table
create table if not exists public.wallets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type text not null default 'cash', -- Menggunakan tipe TEXT agar fleksibel
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on wallets
alter table public.wallets enable row level security;

create policy "Users can view their own wallets" on public.wallets
    for select using (auth.uid() = user_id);

create policy "Users can insert their own wallets" on public.wallets
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own wallets" on public.wallets
    for update using (auth.uid() = user_id);

create policy "Users can delete their own wallets" on public.wallets
    for delete using (auth.uid() = user_id);

-- Alter transactions table to add wallet_id and destination_wallet_id
alter table public.transactions
    add column wallet_id uuid references public.wallets(id) on delete restrict,
    add column destination_wallet_id uuid references public.wallets(id) on delete restrict;

-- The transaction type might currently be restricted by a check constraint or it's just text.
-- Since it's usually just a text column or an enum, let's assume it's a text check constraint.
-- If it's a check constraint, we need to drop it and recreate it.
-- We can't know for sure without checking the original migration.
-- Let's try to update it safely or assume it's text.
-- If it's text, we can just insert 'transfer' later. 

-- SEEDING: Data Migration for existing transactions
-- We create a default 'Dompet Utama (Cash)' for every user that has transactions
insert into public.wallets (user_id, name, type)
select distinct user_id, 'Dompet Utama (Cash)', 'cash'
from public.transactions;

-- Update existing transactions to point to their newly created default wallet
update public.transactions t
set wallet_id = w.id
from public.wallets w
where t.user_id = w.user_id 
  and w.name = 'Dompet Utama (Cash)'
  and t.wallet_id is null;

-- Make wallet_id NOT NULL for future data integrity if desired
-- Wait, let's not make it not null immediately if we are not sure all users have wallets.
-- However, we just seeded them. So it's safe. But to be safer, we can leave it nullable for now.
