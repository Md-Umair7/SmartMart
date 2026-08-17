import { useState, useMemo } from 'react';
import { Lightbulb, ShoppingCart, Plus, X, Sparkles, ArrowRight } from 'lucide-react';
import { useProducts, useTransactionBaskets } from '../hooks/useDatabase';
import { runApriori, getRecommendations } from '../lib/apriori';

export function Recommendations() {
  const { products, loading: prodLoading } = useProducts();
  const { baskets, loading: basketLoading } = useTransactionBaskets();
  const [cart, setCart] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const loading = prodLoading || basketLoading;

  const result = useMemo(() => {
    if (baskets.length === 0) return null;
    return runApriori(baskets, 0.05, 0.2);
  }, [baskets]);

  const recommendations = useMemo(() => {
    if (!result || cart.length === 0) return [];
    return getRecommendations(result.rules, cart, 10);
  }, [result, cart]);

  const availableProducts = products.filter(
    (p) => !cart.includes(p.name) && (search ? p.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const categories = [...new Set(availableProducts.map((p) => p.category))].sort();

  const addProduct = (name: string) => {
    setCart((prev) => [...prev, name]);
    setShowPicker(false);
    setSearch('');
  };

  const removeProduct = (name: string) => setCart((prev) => prev.filter((p) => p !== name));

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">Current Shopping Cart</h3>
          </div>
          <button onClick={() => setShowPicker(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Your cart is empty. Add products to get personalized recommendations.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cart.map((name) => {
              const prod = products.find((p) => p.name === name);
              return (
                <div key={name} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg group">
                  <span className="text-xs font-medium text-emerald-800">{name}</span>
                  {prod && <span className="text-[10px] text-emerald-500">{prod.category}</span>}
                  <button onClick={() => removeProduct(name)} className="p-0.5 rounded hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800">Smart Recommendations</h3>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">Add products to your cart to see recommendations based on purchasing patterns.</div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">No recommendations found for the current cart. Try adding different products.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec, i) => {
              const prod = products.find((p) => p.name === rec.product);
              return (
                <div key={rec.product} className="relative border border-slate-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{rec.product}</p>
                        <p className="text-[10px] text-slate-400">{prod?.category}</p>
                      </div>
                    </div>
                    <button onClick={() => addProduct(rec.product)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600 transition-all">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                    <span className="text-slate-600">{rec.reason}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Confidence</span><span>{(rec.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${rec.confidence * 100}%` }} />
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.lift >= 3 ? 'bg-emerald-100 text-emerald-700' : rec.lift >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      Lift: {rec.lift.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold">How It Works</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="font-semibold text-emerald-400 mb-1">1. Apriori Algorithm</p>
            <p className="text-slate-300 text-xs">Finds products frequently bought together across all transactions using minimum support and confidence thresholds.</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="font-semibold text-emerald-400 mb-1">2. Association Rules</p>
            <p className="text-slate-300 text-xs">Generates IF-THEN rules: "If customer buys X, they also buy Y" with confidence and lift scores.</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="font-semibold text-emerald-400 mb-1">3. Recommendations</p>
            <p className="text-slate-300 text-xs">Matches your cart items against discovered rules to suggest products with the strongest associations.</p>
          </div>
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add to Cart</h3>
              <button onClick={() => setShowPicker(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-4 border-b border-slate-100">
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {categories.map((cat) => {
                const catProducts = availableProducts.filter((p) => p.category === cat);
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {catProducts.map((p) => (
                        <button key={p.id} onClick={() => addProduct(p.name)} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-colors">
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
