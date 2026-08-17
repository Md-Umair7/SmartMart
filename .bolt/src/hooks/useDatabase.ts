import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  name: string;
  category: string;
}

export interface Transaction {
  id: string;
  transaction_date: string;
  customer_id: string | null;
  total_amount: number;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name');
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { products, loading, refetch: fetch };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, items:transaction_items(*, product:products(*))')
      .order('transaction_date', { ascending: false })
      .limit(200);
    if (!error && data) setTransactions(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { transactions, loading, refetch: fetch };
}

export function useTransactionBaskets() {
  const [baskets, setBaskets] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [prodRes, itemRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('transaction_items').select('transaction_id, product_id'),
      ]);

      const prods = (prodRes.data || []) as Product[];
      setProducts(prods);
      const prodMap = new Map(prods.map((p) => [p.id, p.name]));

      const items = (itemRes.data || []) as { transaction_id: string; product_id: string }[];
      const txnMap = new Map<string, string[]>();
      for (const item of items) {
        const name = prodMap.get(item.product_id) || 'Unknown';
        const list = txnMap.get(item.transaction_id) || [];
        list.push(name);
        txnMap.set(item.transaction_id, list);
      }

      setBaskets(Array.from(txnMap.values()));
      setLoading(false);
    }
    load();
  }, []);

  return { baskets, loading, products };
}
