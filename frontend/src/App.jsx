import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DeduplicationStudio from './components/DeduplicationStudio';
import InteractiveSandbox from './components/InteractiveSandbox';
import GovernanceWorkflow from './components/GovernanceWorkflow';
import ERPIntegration from './components/ERPIntegration';
import { fetchHealth, fetchMaterials, fetchAnalytics } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemHealth, setSystemHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, analyticsData, materialsData] = await Promise.all([
        fetchHealth(),
        fetchAnalytics(),
        fetchMaterials(),
      ]);
      setSystemHealth(health);
      setAnalytics(analyticsData);
      setMaterials(materialsData?.materials || []);
    } catch (err) {
      setError('Could not connect to backend. Make sure the Python server is running on port 8000.');
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Cross-component navigation: Deduplication Studio → AI Sandbox
  const handleSelectForSandbox = useCallback((description) => {
    setSandboxInput(description);
    setActiveTab('sandbox');
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            analytics={analytics}
            onNavigateToStudio={() => setActiveTab('studio')}
          />
        );
      case 'studio':
        return (
          <DeduplicationStudio
            materials={materials}
            onRefresh={loadAllData}
            onSelectForSandbox={handleSelectForSandbox}
          />
        );
      case 'sandbox':
        return <InteractiveSandbox initialInput={sandboxInput} />;
      case 'governance':
        return (
          <GovernanceWorkflow
            materials={materials}
            onRefresh={loadAllData}
          />
        );
      case 'erp':
        return (
          <ERPIntegration
            materials={materials}
            onRefresh={loadAllData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        onRefreshData={loadAllData}
      />

      <main className="app-main">
        {loading && (
          <div className="app-loading">
            <div className="loading-spinner" />
            <p>Connecting to AI Material Master Engine…</p>
          </div>
        )}

        {!loading && error && (
          <div className="app-error">
            <div className="error-icon">⚠</div>
            <h2>Backend Offline</h2>
            <p>{error}</p>
            <code>cd backend &amp;&amp; python server.py</code>
            <button id="retry-btn" onClick={loadAllData}>Retry Connection</button>
          </div>
        )}

        {!loading && !error && (
          <div className="tab-content">
            {renderActiveTab()}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
