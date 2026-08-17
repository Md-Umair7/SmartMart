import { useState } from 'react';
import { BarChart3, ShoppingCart, Lightbulb, Database, TrendingUp, Menu, X } from 'lucide-react';

export type Page = 'dashboard' | 'transactions' | 'analysis' | 'recommendations';

const navItems: { page: Page; label: string; icon: typeof BarChart3 }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { page: 'transactions', label: 'Transactions', icon: ShoppingCart },
  { page: 'analysis', label: 'Association Rules', icon: TrendingUp },
  { page: 'recommendations', label: 'Recommendations', icon: Lightbulb },
];

export function Layout({ children, activePage, onNavigate }: {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SmartMart</h1>
              <p className="text-xs text-slate-400">Market Basket Analysis</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => { onNavigate(page); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                activePage === page
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Algorithm</p>
            <p className="text-sm font-semibold text-emerald-400">Apriori</p>
            <p className="text-xs text-slate-500 mt-1">Association Rule Mining</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {navItems.find((n) => n.page === activePage)?.label}
            </h2>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            Live Data
          </span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
