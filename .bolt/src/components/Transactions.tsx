import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useTransactions, TransactionItem } from '../hooks/useDatabase';

export function Transactions() {
  const { transactions, loading } = useTransactions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.customer_id?.toLowerCase().includes(s) ||
      t.transaction_date.includes(s) ||
      t.items?.some((i) => i.product?.name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="text-sm text-slate-500">
          {transactions.length} transactions loaded
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {t.items?.length || 0}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">{t.transaction_date}</p>
                    <p className="text-xs text-slate-400">Customer: {t.customer_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-800">${(t.total_amount || 0).toFixed(2)}</span>
                  {expandedId === t.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {expandedId === t.id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="space-y-2">
                    {(t.items || []).map((item: TransactionItem) => (
                      <div key={item.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{item.product?.category || ''}</span>
                          <span className="text-sm text-slate-700">{item.product?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {item.quantity} x ${(item.unit_price || 0).toFixed(2)} = <strong>${(item.quantity * item.unit_price).toFixed(2)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No transactions found</div>}
        </div>
      )}
    </div>
  );
}
