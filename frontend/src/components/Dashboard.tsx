import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface Stock {
  id: number;
  symbol: string;
  created_at: string;
  price_points: number;
}

interface Signal {
  id: number;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price_at_signal: number;
  created_at: string;
  symbol: string;
}

const Dashboard: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID for now - in a real app this would come from auth
  const userId = 1;

  useEffect(() => {
    fetchStocks();
    fetchSignals();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/stocks/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const data = await response.json();
      setStocks(data.stocks || []);
    } catch (err) {
      setError('Failed to load tracked stocks');
      console.error('Error fetching stocks:', err);
    }
  };

  const fetchSignals = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/signals/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch signals');
      const data = await response.json();
      setSignals(data.signals || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load signals');
      setLoading(false);
      console.error('Error fetching signals:', err);
    }
  };

  const addStock = async (symbol: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/stocks/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, symbol: symbol.toUpperCase() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add stock');
      }

      await fetchStocks(); // Refresh the list
    } catch (err) {
      alert(`Error adding stock: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const removeStock = async (stockId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/stocks/${stockId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove stock');
      await fetchStocks(); // Refresh the list
    } catch (err) {
      alert(`Error removing stock: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getSignalBadgeClass = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return 'signal-badge signal-buy';
      case 'SELL': return 'signal-badge signal-sell';
      case 'HOLD': return 'signal-badge signal-hold';
      default: return 'signal-badge';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📈 StockKing Dashboard</h1>
        <p>Track your stocks and get AI-powered trading signals</p>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Tracked Stocks</h2>
          <div className="add-stock-form">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    addStock(input.value.trim());
                    input.value = '';
                  }
                }
              }}
            />
          </div>

          {stocks.length === 0 ? (
            <div className="empty-state">
              <p>No stocks tracked yet. Add your first stock above!</p>
            </div>
          ) : (
            <div className="stocks-grid">
              {stocks.map((stock) => (
                <div key={stock.id} className="stock-card">
                  <div className="stock-header">
                    <h3>{stock.symbol}</h3>
                    <button
                      className="remove-btn"
                      onClick={() => removeStock(stock.id)}
                      title="Remove from tracking"
                    >
                      ×
                    </button>
                  </div>
                  <div className="stock-info">
                    <p>Data points: {stock.price_points}</p>
                    <p>Added: {new Date(stock.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Recent Trading Signals</h2>
          {signals.length === 0 ? (
            <div className="empty-state">
              <p>No trading signals yet. Signals will appear as our AI analyzes your tracked stocks.</p>
            </div>
          ) : (
            <div className="signals-list">
              {signals.slice(0, 10).map((signal) => (
                <div key={signal.id} className="signal-card">
                  <div className="signal-header">
                    <span className="signal-symbol">{signal.symbol}</span>
                    <span className={getSignalBadgeClass(signal.signal_type)}>
                      {signal.signal_type}
                    </span>
                  </div>
                  <div className="signal-details">
                    <p>Confidence: {(signal.confidence * 100).toFixed(1)}%</p>
                    <p>Price: ${signal.price_at_signal}</p>
                    <p>Time: {new Date(signal.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
