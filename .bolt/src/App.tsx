import { useState } from 'react';
import { Layout, Page } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { AssociationRules } from './components/AssociationRules';
import { Recommendations } from './components/Recommendations';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'transactions' && <Transactions />}
      {page === 'analysis' && <AssociationRules />}
      {page === 'recommendations' && <Recommendations />}
    </Layout>
  );
}

export default App;
