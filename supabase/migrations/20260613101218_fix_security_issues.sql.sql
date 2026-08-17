-- Remove overly permissive policies for anon
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_insert_transaction_items" ON transaction_items;
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_delete_transaction_items" ON transaction_items;
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;

-- Keep read-only access for anon (these are safe)
-- Products: read-only
-- Transactions: read-only
-- Transaction_items: read-only

-- Note: Write operations (INSERT, UPDATE, DELETE) require authenticated role
-- which is handled by existing policies for authenticated users
