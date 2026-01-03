import { useState, useEffect } from 'react';
import { GenerateQuestion, GenerateEmbedding, ExplainMistake } from './components';
import { api } from './services/api';

type TabType = 'question' | 'embedding' | 'mistake';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('question');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await api.checkHealth();
        setIsConnected(health.status === 'ok');
        setHasApiKey(health.hasApiKey);
      } catch {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'question', label: 'Generate Question' },
    { key: 'embedding', label: 'Generate Embedding' },
    { key: 'mistake', label: 'Explain Mistake' },
  ];

  return (
    <div className="container">
      <header className="header">
        <h1>Algebra 2 Tutor</h1>
        <p>AI-powered math learning tools</p>

        {isConnected !== null && (
          <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected
              ? (hasApiKey ? 'Backend Connected' : 'Connected (No API Key)')
              : 'Backend Disconnected'
            }
          </div>
        )}
      </header>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'question' && <GenerateQuestion />}
        {activeTab === 'embedding' && <GenerateEmbedding />}
        {activeTab === 'mistake' && <ExplainMistake />}
      </div>
    </div>
  );
}

export default App;
