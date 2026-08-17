import { ShoppingCart, Package, TrendingUp, BarChart3 } from 'lucide-react';
import { useProducts, useTransactions, useTransactionBaskets } from '../hooks/useDatabase';
import { runApriori } from '../lib/apriori';

export function Dashboard() {
  const { products, loading: prodLoading } = useProducts();
  const { transactions, loading: txnLoading } = useTransactions();
  const { baskets, loading: basketLoading } = useTransactionBaskets();

  const loading = prodLoading || txnLoading || basketLoading;
  const result = !basketLoading && baskets.length > 0
    ? runApriori(baskets, 0.05, 0.3)
    : null;

  const totalRevenue = transactions.reduce((s, t) => s + (t.total_amount || 0), 0);
  const avgBasketSize = baskets.length > 0
    ? (baskets.reduce((s, b) => s + b.length, 0) / baskets.length).toFixed(1)
    : '0';

  const productFreq = new Map<string, number>();
  for (const b of baskets) {
    for (const p of b) {
      productFreq.set(p, (productFreq.get(p) || 0) + 1);
    }
  }
  const topProducts = [...productFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const topRules = result?.rules.slice(0, 6) || [];

  const catFreq = new Map<string, number>();
  for (const b of baskets) {
    for (const item of b) {
      const prod = products.find((p) => p.name === item);
      if (prod) catFreq.set(prod.category, (catFreq.get(prod.category) || 0) + 1);
    }
  }
  const catEntries = [...catFreq.entries()].sort((a, b) => b[1] - a[1]);
  const maxCatVal = catEntries.length > 0 ? catEntries[0][1] : 1;

  const categoryColors: Record<string, string> = {
    Dairy: 'bg-blue-500', Bakery: 'bg-amber-500', Beverages: 'bg-cyan-500',
    Fruit: 'bg-green-500', Meat: 'bg-red-500', Grains: 'bg-yellow-600',
    Pantry: 'bg-orange-500', Snacks: 'bg-pink-500', Frozen: 'bg-indigo-400',
    Household: 'bg-teal-500', Seafood: 'bg-sky-500', Breakfast: 'bg-violet-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Transactions" value={transactions.length.toString()} sub={`${baskets.length} baskets analyzed`} color="emerald" />
        <StatCard icon={Package} label="Products" value={products.length.toString()} sub={`${new Set(products.map(p => p.category)).size} categories`} color="blue" />
        <StatCard icon={TrendingUp} label="Association Rules" value={(result?.rules.length || 0).toString()} sub={`${result?.frequentItemsets.length || 0} frequent itemsets`} color="amber" />
        <StatCard icon={BarChart3} label="Avg Basket Size" value={avgBasketSize} sub={`Revenue: $${totalRevenue.toFixed(0)}`} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Products by Frequency</h3>
          <div className="space-y-3">
            {topProducts.map(([name, count]) => {
              const pct = (count / baskets.length) * 100;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{name}</span>
                    <span className="text-slate-400 text-xs">{count}x ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {catEntries.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${categoryColors[cat] || 'bg-slate-400'}`} />
                <span className="text-sm text-slate-600 w-24 truncate">{cat}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${categoryColors[cat] || 'bg-slate-400'}`} style={{ width: `${(count / maxCatVal) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Association Rules</h3>
          <div className="space-y-3">
            {topRules.map((rule, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1 text-sm flex-wrap">
                  {rule.antecedent.map((a, j) => (
                    <span key={j}>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{a}</span>
                      {j < rule.antecedent.length - 1 && <span className="text-slate-400 mx-0.5">+</span>}
                    </span>
                  ))}
                  <span className="text-emerald-500 font-bold mx-1">&rarr;</span>
                  {rule.consequent.map((c, j) => (
                    <span key={j}>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{c}</span>
                      {j < rule.consequent.length - 1 && <span className="text-slate-400 mx-0.5">+</span>}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>Conf: <strong className="text-slate-700">{(rule.confidence * 100).toFixed(1)}%</strong></span>
                  <span>Lift: <strong className="text-emerald-600">{rule.lift.toFixed(2)}</strong></span>
                </div>
              </div>
            ))}
            {topRules.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No rules discovered yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Date</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Customer</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Items</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-slate-600">{t.transaction_date}</td>
                  <td className="py-2 px-3 text-slate-600">{t.customer_id || '-'}</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(t.items || []).map((item) => (
                        <span key={item.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          {item.product?.name || 'Unknown'} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700 font-medium">${(t.total_amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof ShoppingCart; label: string; value: string; sub: string; color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-700' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', text: 'text-rose-700' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
