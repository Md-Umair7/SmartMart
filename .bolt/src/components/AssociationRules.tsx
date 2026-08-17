import { useState, useMemo } from 'react';
import { TrendingUp, ArrowRight, Filter, Download } from 'lucide-react';
import { useTransactionBaskets } from '../hooks/useDatabase';
import { runApriori, AssociationRule, FrequentItemset } from '../lib/apriori';

export function AssociationRules() {
  const { baskets, loading } = useTransactionBaskets();
  const [minSupport, setMinSupport] = useState(0.05);
  const [minConfidence, setMinConfidence] = useState(0.3);
  const [maxItemsetSize, setMaxItemsetSize] = useState(4);
  const [activeTab, setActiveTab] = useState<'rules' | 'itemsets'>('rules');
  const [sortBy, setSortBy] = useState<'lift' | 'confidence' | 'support'>('lift');
  const [filterText, setFilterText] = useState('');

  const result = useMemo(() => {
    if (baskets.length === 0) return null;
    return runApriori(baskets, minSupport, minConfidence, maxItemsetSize);
  }, [baskets, minSupport, minConfidence, maxItemsetSize]);

  const filteredRules = useMemo(() => {
    if (!result) return [];
    let rules = [...result.rules];
    if (filterText) {
      const f = filterText.toLowerCase();
      rules = rules.filter(r => r.antecedent.some(a => a.toLowerCase().includes(f)) || r.consequent.some(c => c.toLowerCase().includes(f)));
    }
    rules.sort((a, b) => b[sortBy] - a[sortBy]);
    return rules;
  }, [result, sortBy, filterText]);

  const filteredItemsets = useMemo(() => {
    if (!result) return [];
    let itemsets = [...result.frequentItemsets];
    if (filterText) {
      const f = filterText.toLowerCase();
      itemsets = itemsets.filter(i => i.items.some(it => it.toLowerCase().includes(f)));
    }
    itemsets.sort((a, b) => b.support - a.support);
    return itemsets;
  }, [result, filterText]);

  const exportCSV = () => {
    if (!result || filteredRules.length === 0) return;
    const rows = filteredRules.map((r) => ({
      Antecedent: r.antecedent.join('; '),
      Consequent: r.consequent.join('; '),
      Support: r.support.toFixed(4),
      Confidence: r.confidence.toFixed(4),
      Lift: r.lift.toFixed(4),
    }));
    const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'association_rules.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-800">Algorithm Parameters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Min Support: {(minSupport * 100).toFixed(0)}%</label>
            <input type="range" min={0.01} max={0.5} step={0.01} value={minSupport} onChange={(e) => setMinSupport(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
            <p className="text-xs text-slate-400 mt-1">How often items appear together</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Min Confidence: {(minConfidence * 100).toFixed(0)}%</label>
            <input type="range" min={0.1} max={1} step={0.05} value={minConfidence} onChange={(e) => setMinConfidence(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
            <p className="text-xs text-slate-400 mt-1">How often the rule is true</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Max Itemset Size: {maxItemsetSize}</label>
            <input type="range" min={2} max={6} step={1} value={maxItemsetSize} onChange={(e) => setMaxItemsetSize(parseInt(e.target.value))} className="w-full accent-emerald-500" />
            <p className="text-xs text-slate-400 mt-1">Maximum items in a group</p>
          </div>
        </div>
        {result && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-sm flex-wrap">
            <span className="text-slate-500">Found <strong className="text-slate-800">{result.frequentItemsets.length}</strong> frequent itemsets</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500"><strong className="text-slate-800">{result.rules.length}</strong> association rules</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">From <strong className="text-slate-800">{baskets.length}</strong> transactions</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Association Rules</button>
          <button onClick={() => setActiveTab('itemsets')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'itemsets' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Frequent Itemsets</button>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'rules' && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['lift', 'confidence', 'support'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
          <button onClick={exportCSV} disabled={!result || filteredRules.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Filter by product name..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
      </div>

      {activeTab === 'rules' ? <RulesTable rules={filteredRules} /> : <ItemsetsTable itemsets={filteredItemsets} />}
    </div>
  );
}

function RulesTable({ rules }: { rules: AssociationRule[] }) {
  const getLiftColor = (lift: number) => {
    if (lift >= 3) return 'text-emerald-700 bg-emerald-50';
    if (lift >= 2) return 'text-emerald-600 bg-emerald-50/50';
    if (lift >= 1) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceBg = (conf: number) => {
    if (conf >= 0.8) return 'bg-emerald-500';
    if (conf >= 0.6) return 'bg-emerald-400';
    if (conf >= 0.4) return 'bg-amber-400';
    return 'bg-slate-300';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Rule</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Support</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Confidence</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Lift</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Conviction</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 flex-wrap">
                    {rule.antecedent.map((a, j) => (
                      <span key={j}>
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{a}</span>
                        {j < rule.antecedent.length - 1 && <span className="text-slate-300 mx-0.5">+</span>}
                      </span>
                    ))}
                    <ArrowRight className="w-4 h-4 text-emerald-500 mx-1 flex-shrink-0" />
                    {rule.consequent.map((c, j) => (
                      <span key={j}>
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{c}</span>
                        {j < rule.consequent.length - 1 && <span className="text-slate-300 mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-slate-700 font-medium">{(rule.support * 100).toFixed(1)}%</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-slate-700 font-medium">{(rule.confidence * 100).toFixed(1)}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getConfidenceBg(rule.confidence)}`} style={{ width: `${rule.confidence * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getLiftColor(rule.lift)}`}>{rule.lift.toFixed(2)}</span>
                </td>
                <td className="py-3 px-4 text-center text-slate-600">{rule.conviction.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rules.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No rules found. Try adjusting the parameters.</div>}
    </div>
  );
}

function ItemsetsTable({ itemsets }: { itemsets: FrequentItemset[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Items</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Size</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Count</th>
              <th className="text-center py-3 px-4 text-slate-600 font-semibold">Support</th>
            </tr>
          </thead>
          <tbody>
            {itemsets.map((is, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {is.items.map((item, j) => <span key={j} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">{item}</span>)}
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-slate-500">{is.items.length}</td>
                <td className="py-3 px-4 text-center text-slate-700 font-medium">{is.count}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-slate-700 font-medium">{(is.support * 100).toFixed(1)}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(is.support * 100, 100)}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {itemsets.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No frequent itemsets found. Try lowering the minimum support.</div>}
    </div>
  );
}
