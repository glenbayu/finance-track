-- 1. Hapus check constraint yang lama
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 2. Buat kembali check constraint dengan menambahkan 'transfer' (dan 'adjustment' jika kamu menggunakannya)
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'transfer', 'adjustment'));
