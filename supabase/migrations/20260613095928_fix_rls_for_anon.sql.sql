-- Allow anonymous (anon key) access for reading
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon USING (true);

CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon USING (true);

CREATE POLICY "anon_select_transaction_items" ON transaction_items FOR SELECT
  TO anon USING (true);

-- Allow anon to insert transactions and items
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_transaction_items" ON transaction_items FOR INSERT
  TO anon WITH CHECK (true);

-- Allow anon to delete their own transactions
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon USING (true);

CREATE POLICY "anon_delete_transaction_items" ON transaction_items FOR DELETE
  TO anon USING (true);

-- Allow anon update
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon USING (true) WITH CHECK (true);
